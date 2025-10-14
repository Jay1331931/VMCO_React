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
    const [selectedBranchNameEn, setSelectedBranchNameEn] = useState('');
    const [selectedBranchNameLc, setSelectedBranchNameLc] = useState('');
    const [selectedBranchId, setSelectedBranchId] = useState('');
    const [selectedBranchErpId, setSelectedBranchErpId] = useState('');
    const [selectedBranchSequenceId, setSelectedBranchSequenceId] = useState('');
    const [selectedBranchRegion, setSelectedBranchRegion] = useState('');
    const [selectedBranchCity, setSelectedBranchCity] = useState('');
    const [selectedBranchStatus, setSelectedBranchStatus] = useState('');
    const [showPaymentPopup, setShowPaymentPopup] = useState(false);
    const [pendingOrderCategory, setPendingOrderCategory] = useState(null);
    const [entityDescriptions, setEntityDescriptions] = useState([]);
    const [pendingOrderItems, setPendingOrderItems] = useState([]);
    const [isLoading, setIsLoading] = useState(false); const [error, setError] = useState(null);
    const [cartItems, setCartItems] = useState([]);
    const [filteredCartItems, setFilteredCartItems] = useState([]);
    const [isPlacingOrder, setIsPlacingOrder] = useState(false);
    const { token, user, logout, loading } = useAuth();

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
            if (location.state.selectedBranchNameEn) setSelectedBranchNameEn(location.state.selectedBranchNameEn);
            if (location.state.selectedBranchErpId) setSelectedBranchErpId(location.state.selectedBranchErpId);
            if (location.state.selectedBranchSequenceId) setSelectedBranchSequenceId(location.state.selectedBranchSequenceId);
            if (location.state.selectedBranchRegion) setSelectedBranchRegion(location.state.selectedBranchRegion);
            if (location.state.selectedBranchCity) setSelectedBranchCity(location.state.selectedBranchCity);
            if (location.state.selectedBranchStatus) setSelectedBranchStatus(location.state.selectedBranchStatus);
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
                // Include cookies/auth tokens
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
                const productType = (product.productType).toLowerCase();
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
                // const isMachine = isProductMachine(product);

                // // Add isMachine flag to formattedItem
                // formattedItem.isMachine = isMachine;

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
                { category: Constants.ENTITY.VMCO, items: vmco },
                { category: Constants.ENTITY.SHC, items: shc },
                { category: Constants.ENTITY.GMTC, items: gmtc },
                { category: Constants.ENTITY.NAQI, items: naqi },
                { category: Constants.ENTITY.DAR, items: dar }
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
            return;
        }

        try {
            setIsPlacingOrder(true);
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
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },

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
    };

    const handleQuantityChange = (itemId, delta) => {
        // Find the item in any category to get its MOQ
        const item = cartItems.flatMap(category => category.items).find(item => item.id === itemId);
        const moq = item ? Number(item.moq) || 1 : 1;

        setQuantities(prev => {
            // Ensure we're working with numbers, not strings
            const currentQty = Number(prev[itemId] || item?.quantity || 0);
            // Allow quantity changes without MOQ restrictions for button clicks
            const newQty = Math.max(0, currentQty + Number(delta));

            return {
                ...prev,
                [itemId]: newQty
            };
        });
    };

    const handleQuantityInputChange = (itemId, value) => {
        setQuantities(prev => ({
            ...prev,
            [itemId]: value
        }));
    };

    const handleContinueShopping = () => {
        navigate('/catalog', {
            state: {
                selectedBranchId,
                selectedBranchNameEn,
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

                const orderFilters = new URLSearchParams({
                    filters: JSON.stringify({
                        customerId: selectedCustomerId,
                        status: 'Open',
                        entity: getEntityFromCategory(pendingOrderCategory),
                        paymentMethod: 'Cash on Delivery'
                    })
                });
                console.log(`Checking existing COD orders with filters: ${orderFilters.toString()}`);

                const existingOrdersResponse = await fetch(`${API_BASE_URL}/sales-order/pagination?${orderFilters}`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },

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
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },

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
        } else if (entity && entity.toLowerCase() === Constants.ENTITY.VMCO.toLowerCase()) {
            // Handle VMCO order processing with selected payment method
            handleVMCOOrderProcessing(pendingOrderItems, pendingOrderCategory, method);
        } else {
            // For NAQI, GMTC, DAR - directly place order with selected payment method
            placeOrderForCategory(pendingOrderItems, pendingOrderCategory, method, true);
        }
    };

    // Handle SHC order splitting into fresh and non-fresh products
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

            // Check if using Pre Payment method for temp table approach
            if (selectedPaymentMethod?.toLowerCase() === 'pre payment') {
                console.log('Using temp table approach for SHC Pre Payment orders');

                if (freshProducts.length > 0) {
                    const freshTempOrderId = await createTempOrder(
                        freshProducts,
                        `${categoryName} - Fresh`,
                        selectedPaymentMethod,
                        true
                    );
                    if (freshTempOrderId) {
                        orderIds.push(freshTempOrderId);
                        console.log('Created fresh temp order ID:', freshTempOrderId);
                    }
                }

                if (nonFreshProducts.length > 0) {
                    const nonFreshTempOrderId = await createTempOrder(
                        nonFreshProducts,
                        `${categoryName} - Non-Fresh`,
                        selectedPaymentMethod,
                        false
                    );
                    if (nonFreshTempOrderId) {
                        orderIds.push(nonFreshTempOrderId);
                        console.log('Created non-fresh temp order ID:', nonFreshTempOrderId);
                    }
                }

                if (orderIds.length > 0) {
                    try {
                        console.log('Generating payment link for temp order IDs:', orderIds);
                        const paymentLinkResponse = await axios.post(`${API_BASE_URL}/generatePayment-link`, {
                            id: orderIds?.map(String).join(','),
                            endPoint: 'payment-options/order',
                            IsEmail: false,
                            salesOrderType: "cart"
                        }, {
                            headers: {
                                'Authorization': `Bearer ${token}`
                            }
                        });

                        if (paymentLinkResponse?.data?.details?.url) {
                            console.log('Payment link generated successfully, redirecting to:', paymentLinkResponse.data.details.url);
                            window.location.replace(paymentLinkResponse?.data?.details?.url)
                        } else {
                            console.error('Payment URL not found in response:', paymentLinkResponse.data);
                        }
                    } catch (error) {
                        console.error('Error generating payment link for temp orders:', error);
                        Swal.fire({
                            icon: 'error',
                            title: t('Payment Link Error'),
                            text: t('Failed to generate payment link. Please try again.'),
                            confirmButtonText: t('OK')
                        });
                    }
                }
            } else {
                if (freshProducts.length > 0) {
                    console.log('Placing order for SHC fresh products with selected payment method:', selectedPaymentMethod);
                    const freshOrderId = await placeOrderForCategory(freshProducts, categoryName + ' - Fresh', selectedPaymentMethod, false, true);
                    console.log('Fresh order result:', freshOrderId);
                    if (freshOrderId) {
                        orderIds.push(freshOrderId);
                        console.log('Added fresh order ID to array:', freshOrderId);
                    }
                }
                if (nonFreshProducts.length > 0) {
                    console.log('Placing order for SHC non-fresh products with selected payment method:', selectedPaymentMethod);
                    const nonFreshOrderId = await placeOrderForCategory(nonFreshProducts, categoryName + ' - Non-Fresh', selectedPaymentMethod, false, false);
                    console.log('Non-fresh order result:', nonFreshOrderId);
                    if (nonFreshOrderId) {
                        orderIds.push(nonFreshOrderId);
                        console.log('Added non-fresh order ID to array:', nonFreshOrderId);
                    }
                }
            }

            if (orderIds.length > 0) {
                console.log('Order IDs collected:', orderIds);
                const orderText = orderIds.length === 1
                    ? t(`Your order has been placed successfully! Order #${orderIds[0]}`)
                    : t(`Your orders have been placed successfully! Orders: ${orderIds.map(id => `#${id}`).join(' and ')}`);

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

    const createTempOrder = async (categoryItems, categoryName, selectedPaymentMethod, isFresh) => {
        try {
            const entity = getEntityFromCategory(categoryName);
            const userId = user?.userId;

            let totalAmount = 0;
            categoryItems.forEach(item => {
                const quantity = Number(quantities[item.id] || item.quantity || 1);
                const unitPrice = parseFloat(item.price || item.unitPrice || 0);
                const vatPercentage = parseFloat(item.vatPercentage || 0);
                const baseAmount = unitPrice * quantity;
                const vatAmount = (baseAmount * vatPercentage) / 100;
                totalAmount += baseAmount + vatAmount;
            });

            const customerResponse = await fetch(`${API_BASE_URL}/customers/id/${selectedCustomerId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!customerResponse.ok) {
                throw new Error('Failed to fetch customer data');
            }

            const customerData = await customerResponse.json();

            const orderPayload = {
                customerId: selectedCustomerId,
                erpCustId: user?.erpCustomerId,
                companyNameEn: customerData?.data?.companyNameEn,
                companyNameAr: customerData?.data?.companyNameAr,
                brandNameEn: customerData?.data?.brandNameEn,
                brandNameAr: customerData?.data?.brandNameAr,
                branchId: selectedBranchId,
                branchNameEn: selectedBranchName,
                branchNameLc: selectedBranchNameLc,
                branchCity: selectedBranchCity,
                erpBranchId: selectedBranchErpId,
                branchSequenceId: selectedBranchSequenceId,
                branchRegion: selectedBranchRegion,
                entity: entity,
                paymentMethod: selectedPaymentMethod,
                totalAmount: totalAmount.toFixed(2),
                paidAmount: '0.00',
                deliveryCharges: '0.00',
                paymentStatus: 'Pending',
                status: 'Open',
                productCategory: categoryName,
                isFresh: isFresh
            };

            const orderLinesPayload = [];
            let lineNumber = 1;

            for (const item of categoryItems) {
                const quantity = Number(quantities[item.id] || item.quantity || 1);
                const unitPrice = parseFloat(item.price || item.unitPrice || 0);
                const vatPercentage = parseFloat(item.vatPercentage || 0);
                const baseAmount = unitPrice * quantity;
                const vatAmount = (baseAmount * vatPercentage) / 100;
                const netAmount = baseAmount + vatAmount;

                const linePayload = {
                    productId: item.productId || item.product_id,
                    productName: item.name || item.productName,
                    productNameLc: item.nameLc || item.productNameLc,
                    isFresh: isFresh,
                    quantity: quantity,
                    unit: item.unit || 'EA',
                    unitPrice: unitPrice,
                    vatPercentage: vatPercentage,
                    salesTaxAmount: vatAmount.toFixed(2),
                    netAmount: netAmount.toFixed(2),
                    lineNumber: lineNumber,
                    erpProdId: item.erpProdId || item.productCode
                };

                orderLinesPayload.push(linePayload);
                lineNumber++;
            }

            const tempOrderPayload = {
                userId: userId,
                entity: entity,
                paymentMethod: selectedPaymentMethod,
                totalAmount: totalAmount.toFixed(2),
                orderDetails: orderPayload,
                orderLinesDetails: orderLinesPayload
            };

            const tempOrderResponse = await fetch(`${API_BASE_URL}/temp-sales-order`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(tempOrderPayload)
            });

            if (!tempOrderResponse.ok) {
                const errorText = await tempOrderResponse.text();
                throw new Error(JSON.parse(errorText)?.message || 'Failed to create temp order');
            }

            const tempOrderResult = await tempOrderResponse.json();
            console.log('Created temp order successfully:', tempOrderResult.data.id);
            return tempOrderResult.data.id;

        } catch (error) {
            console.error('Error creating temp order:', error);
            throw error;
        }
    };

    const handleVMCOOrderProcessing = async (categoryItems, categoryName, selectedPaymentMethod) => {
        try {
            setIsPlacingOrder(true);
            const entity = getEntityFromCategory(categoryName);

            // Separate VMCO products into machines and consumables
            const machineProducts = categoryItems.filter(item => item.isMachine === true);
            const nonMachineProducts = categoryItems.filter(item => !item.isMachine);

            console.log('VMCO order processing separated:', {
                total: categoryItems.length,
                machines: machineProducts.length,
                consumables: nonMachineProducts.length,
                machineProductIds: machineProducts.map(p => p.product_id),
                nonMachineProductIds: nonMachineProducts.map(p => p.product_id),
                selectedPaymentMethod
            });

            const orderIds = [];

            // First, place order for machines with Pre Payment
            if (machineProducts.length > 0) {
                console.log('Placing order for VMCO machines with Pre Payment');
                const machineOrderId = await placeOrderForCategory(machineProducts, categoryName + ' - Machines', 'Pre Payment', false);
                console.log('Machine order result:', machineOrderId);
                if (machineOrderId) {
                    orderIds.push(machineOrderId);
                    console.log('Added machine order ID to array:', machineOrderId);
                }
            }

            // Then, place order for non-machine products with selected payment method
            if (nonMachineProducts.length > 0) {
                console.log('Placing order for VMCO consumables with selected payment method:', selectedPaymentMethod);
                const consumableOrderId = await placeOrderForCategory(nonMachineProducts, categoryName + ' - Consumables', selectedPaymentMethod, false);
                console.log('Consumable order result:', consumableOrderId);
                if (consumableOrderId) {
                    orderIds.push(consumableOrderId);
                    console.log('Added consumable order ID to array:', consumableOrderId);
                }
            }

            // Show combined success message for VMCO orders
            if (orderIds.length > 0) {
                console.log('Order IDs collected:', orderIds);
                const orderText = orderIds.length === 1
                    ? t(`Your order is successfully placed and is under review for approval.`) + t(` #${orderIds[0]}`)
                    : t(`Your orders is successfully placed and is under review for approval.:`) + ` ${orderIds.map(id => `#${id}`).join(t('and'))}`;

                console.log('Order success message:', orderText);

                Swal.fire({
                    icon: 'success',
                    title: t('Request Sent'),
                    text: orderText,
                    confirmButtonText: t('OK')
                }).then(async () => {
                    // Delete machine products from cart after successful order
                    if (machineProducts.length > 0) {
                        await deleteCartItems(selectedCustomerId, selectedBranchId, entity, null, true, machineProducts);
                        console.log('Deleted machine products from cart after order:', machineProducts);
                    }

                    // Delete non-machine products from cart after successful order
                    if (nonMachineProducts.length > 0) {
                        await deleteCartItems(selectedCustomerId, selectedBranchId, entity, null, false, nonMachineProducts);
                        console.log('Deleted non-machine products from cart after order:', nonMachineProducts);
                    }

                    // Update cart items state to remove ordered items
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

                    // Force a refresh of cart items
                    fetchCartItems();
                });
            }

        } catch (err) {
            console.error('Error in VMCO order processing:', err);
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

        const itemsWithInvalidMOQ = [];

        for (const item of categoryItems) {
            const currentQuantity = Number(quantities[item.id]) || 0;
            const moq = Number(item.moq) || 1;
            if (currentQuantity < moq) {
                itemsWithInvalidMOQ.push(item);
            }
        }

        if (itemsWithInvalidMOQ.length > 0) {
            const updatedQuantities = { ...quantities };
            itemsWithInvalidMOQ.forEach(item => {
                const itemMoq = Number(item.moq) || 1;
                updatedQuantities[item.id] = itemMoq;
            });
            setQuantities(updatedQuantities);
            return;
        }

        if (selectedCustomerStatus.toLowerCase() !== 'approved') {
            Swal.fire({
                icon: 'warning',
                title: t('Order Blocked'),
                text: t('The Customer is not approved to place order.'),
                confirmButtonText: t('OK')
            });
            return;
        }

        if (selectedBranchStatus.toLowerCase() !== 'approved' || !selectedBranchErpId) {
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
            if (entity?.toLowerCase() === Constants.ENTITY.VMCO.toLowerCase()) {
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

                // For VMCO, handle consumables with credit check, then process both machines and consumables
                if (nonMachineProducts.length > 0) {
                    console.log('Checking if user is credit user for VMCO consumables');

                    // Check if credit payment is allowed for VMCO entity
                    const isCreditAllowed = await isCreditPaymentAllowed(selectedCustomerId, entity);

                    if (isCreditAllowed) {
                        // Calculate total amount for consumables to validate balance
                        let consumablesTotalAmount = 0;
                        nonMachineProducts.forEach(item => {
                            const baseAmount = Number(item.price) * Number(quantities[item.id] || item.quantity || 1);
                            const vatPercentage = Number(item.vatPercentage) || 0;
                            const vatAmount = (baseAmount * vatPercentage) / 100;
                            const itemTotal = baseAmount + vatAmount;
                            consumablesTotalAmount += itemTotal;
                        });

                        // Validate credit balance
                        const isBalanceValid = await validateCreditBalance(selectedCustomerId, consumablesTotalAmount, entity);

                        if (isBalanceValid) {
                            // Credit user with sufficient balance - place order directly with Credit
                            console.log('VMCO user is credit user with sufficient balance, placing consumables order directly with Credit');
                            await handleVMCOOrderProcessing(categoryItems, categoryName, 'Credit');
                            return;
                        } else {
                            // Credit user but insufficient balance - show payment popup
                            console.log('VMCO user is credit user but has insufficient balance, showing payment popup');
                            setPendingOrderCategory(categoryName);
                            setPendingOrderItems(categoryItems); // Pass all items so we can separate later
                            setShowPaymentPopup(true);
                            return; // Exit function to wait for user payment method selection
                        }
                    } else {
                        // Non-credit user - show payment popup
                        console.log('VMCO user is non-credit user, showing payment method selection for consumables');
                        setPendingOrderCategory(categoryName);
                        setPendingOrderItems(categoryItems); // Pass all items so we can separate later
                        setShowPaymentPopup(true);
                        return; // Exit function to wait for user payment method selection
                    }
                } else if (machineProducts.length > 0) {
                    // If only machines, proceed directly
                    console.log('Only VMCO machines found, placing order directly with Pre Payment');
                    const machineOrderId = await placeOrderForCategory(machineProducts, categoryName + ' - Machines', 'Pre Payment', false);
                    if (machineOrderId) {
                        await deleteCartItems(selectedCustomerId, selectedBranchId, entity, null, true, machineProducts);

                        Swal.fire({
                            icon: 'success',
                            title: t('Request Sent'),
                            text: t(`Your request has been sent for approval! Order #${machineOrderId}`),
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
                // For NAQI, GMTC, DAR - directly place order with selected payment method
                await placeOrderForCategory(categoryItems, categoryName, selectedPaymentMethod, true);
            }

        } catch (err) {
            setError(err.message);
            Swal.fire({
                icon: 'error',
                title: t('Order Failed'),
                text: t('Failed to place order: ') + err.message,
                confirmButtonText: t('OK')
            });
        } finally {
            setIsPlacingOrder(false);
        }
    };

    const placeOrderForCategory = async (categoryItems, categoryName, selectedPaymentMethod, showSuccessMessage = true, isFresh = false) => {
        if (categoryItems.length === 0) {
            Swal.fire({
                icon: 'info',
                title: t('No Items'),
                text: t('No items in this category to order.'),
                confirmButtonText: t('OK')
            });
            return;
        }

        try {
            let initialDeliveryCharges = 0.00;
            const entity = getEntityFromCategory(categoryName);
            console.log('Entity determination:', categoryName, entity);

            let orderByName;
            const userId = user?.userId;

            if (userId) {
                try {
                    const usernameRes = await fetch(`${API_BASE_URL}/user/get-username-by-id/${userId}`, {
                        method: 'GET',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        }
                    });

                    if (usernameRes.ok) {
                        const contentType = usernameRes.headers.get('content-type');
                        if (contentType && contentType.includes('application/json')) {
                            const usernameResult = await usernameRes.json();
                            if (usernameResult && (usernameResult.userName || usernameResult.username)) {
                                orderByName = usernameResult.userName || usernameResult.username;
                            }
                        }
                    } else {
                        console.error('Failed to fetch username HTTP:', usernameRes.status);
                    }
                } catch (error) {
                    console.error('Failed to fetch userName for orderBy:', error);
                }
            }

            // Fetch customer data
            const customerResponse = await fetch(`${API_BASE_URL}/customers/id/${selectedCustomerId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!customerResponse.ok) {
                throw new Error('Failed to fetch customer data for delivery charge evaluation');
            }

            const customerData = await customerResponse.json();
            const isDeliveryChargesApplicable = customerData?.data?.isDeliveryChargesApplicable;
            const companyNameEn = customerData?.data?.companyNameEn;
            const companyNameAr = customerData?.data?.companyNameAr;
            const brandNameEn = customerData?.data?.brandNameEn;
            const brandNameAr = customerData?.data?.brandNameAr;
            const pricingPolicy = entity ? customerData?.data?.pricingPolicy?.[entity] : null;
            const customerRegion = customerData.data?.region;
            const assignedToEntityWiseRaw = customerData?.data?.assignedToEntityWise;

            let assignedTo = customerData?.data?.assignedTo;
            if (assignedToEntityWiseRaw) {
                try {
                    const assignedToEntityWise = typeof assignedToEntityWiseRaw === 'string'
                        ? JSON.parse(assignedToEntityWiseRaw)
                        : assignedToEntityWiseRaw;

                    if (entity && assignedToEntityWise[entity.toLowerCase()]) {
                        assignedTo = assignedToEntityWise[entity.toLowerCase()];
                    }
                } catch (e) {
                    console.error('Error parsing assignedToEntityWise:', e);
                }
            }

            let initialTotalAmount = 0;
            for (const item of categoryItems) {
                const newQuantity = Number(quantities[item.id] || item.quantity || item.moq || 1);
                const unitPrice = parseFloat(item.unitPrice || item.price || 0);
                const vatPercentage = parseFloat(item.vatPercentage || 0);

                if (isNaN(newQuantity) || isNaN(unitPrice) || isNaN(vatPercentage) || newQuantity <= 0 || unitPrice <= 0) {
                    console.warn('Invalid values detected in order calculation:', {
                        itemId: item.id,
                        newQuantity,
                        unitPrice,
                        vatPercentage,
                        availablequantities: quantities[item.id],
                        itemquantity: item.quantity,
                        itemmoq: item.moq,
                        item
                    });
                    continue;
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

            if (isNaN(initialTotalAmount) || initialTotalAmount <= 0) {
                console.error('Invalid initialTotalAmount calculated:', initialTotalAmount);
                throw new Error(`Invalid initial total amount: ${initialTotalAmount}`);
            }

            console.log('Initial total amount calculated:', initialTotalAmount);

            // Calculate delivery charges
            const isVmcoMachine = categoryName.toLowerCase().includes('machines') || categoryName.toLowerCase().includes('machine');

            if (isDeliveryChargesApplicable === true) {
                if (!isVmcoMachine && initialTotalAmount < 150) {
                    initialDeliveryCharges = 20.00;
                    console.log('Delivery charges applied: 20.00 (not VMCO machine and total < 150)');
                } else {
                    console.log('No delivery charges:', isVmcoMachine ? 'VMCO machine' : `total amount ${initialTotalAmount} >= 150`);
                }
            } else {
                console.log('Delivery charges not applicable for customer');
            }

            const finalTotalAmount = initialTotalAmount + initialDeliveryCharges;
            console.log('Delivery charges calculation:', {
                isDeliveryChargesApplicable,
                isVmcoMachine,
                initialTotalAmount,
                initialDeliveryCharges,
                finalTotalAmount
            });

            // Create order and order lines payloads
            const isMachineOrder = categoryName.toLowerCase().includes('machines') || categoryName.toLowerCase().includes('machine');
            const isFreshOrder = categoryName.toLowerCase().includes('fresh') || categoryName.toLowerCase().includes('fresh');

            let orderStatus = 'Open'; // Default status
            if (entity && entity.toLowerCase() === Constants.ENTITY.VMCO.toLowerCase()) {
                orderStatus = 'Pending';
            } else if (entity && entity.toLowerCase() === Constants.ENTITY.SHC.toLowerCase()) {
                orderStatus = 'Open';
            } else if (entity && entity.toLowerCase() === Constants.ENTITY.NAQI.toLowerCase()) {
                orderStatus = 'Pending';
            } else {
                const pm = selectedPaymentMethod ? selectedPaymentMethod.toLowerCase() : '';
                if (pm === 'credit' || pm === 'cash on delivery') {
                    orderStatus = 'Approved';
                } else if (pm === 'pre payment') {
                    orderStatus = 'Pending';
                }
            }

            const orderPayload = {
                customerId: selectedCustomerId,
                erpCustId: erpCustId,
                companyNameEn: companyNameEn,
                companyNameAr: companyNameAr,
                brandNameEn: brandNameEn,
                brandNameAr: brandNameAr,
                branchId: selectedBranchId,
                branchNameEn: selectedBranchNameEn,
                branchNameLc: selectedBranchNameLc,
                branchCity: selectedBranchCity,
                erpBranchId: selectedBranchErpId,
                branchSequenceId: selectedBranchSequenceId,
                branchRegion: selectedBranchRegion,
                orderBy: orderByName,
                entity,
                paymentMethod: selectedPaymentMethod,
                totalAmount: finalTotalAmount.toFixed(2), // Use finalTotalAmount instead of initialTotalAmount
                paidAmount: '0.00',
                deliveryCharges: initialDeliveryCharges.toFixed(2), // Add delivery charges to payload
                paymentStatus: selectedPaymentMethod === 'Credit' ? 'Credit' : 'Pending',
                status: orderStatus,
                pricingPolicy: pricingPolicy,
                salesExecutive: assignedTo,
                customerRegion: customerRegion,
                productCategory: categoryName,
                paymentPercentage: '100.00',
                isMachine: isMachineOrder,
                isFresh: isFresh
            };

            // Create order lines payload
            const orderLinesPayload = [];
            let lineNumber = 1;

            for (const item of categoryItems) {
                const productId = item.productId || item.productId || item.id;
                const newQuantity = parseInt(quantities[item.id] || item.quantity || item.moq || 1);
                const unitPrice = parseFloat(item.unitPrice || item.price || 0);
                const vatPercentage = parseFloat(item.vatPercentage || 0);

                if (isNaN(newQuantity) || isNaN(unitPrice) || isNaN(vatPercentage) || newQuantity <= 0 || unitPrice <= 0) {
                    console.error('Invalid order line values:', {
                        itemId: item.id,
                        productId,
                        newQuantity,
                        unitPrice,
                        vatPercentage,
                        availablequantities: quantities[item.id],
                        itemquantity: item.quantity,
                        itemmoq: item.moq
                    });
                    continue;
                }

                const baseAmount = unitPrice * newQuantity;
                const vatAmount = (baseAmount * vatPercentage) / 100;
                const netAmount = baseAmount + vatAmount;

                const productName = item.productName || item.name || 'Product';
                const productNameLc = item.productNameLc || item.nameLc || productName;

                let lineMachine = false;
                let lineFresh = false;

                if (entity && entity.toLowerCase() === Constants.ENTITY.VMCO.toLowerCase()) {
                    lineMachine = item.isMachine === true;
                    lineFresh = false;
                } else if (entity && entity.toLowerCase() === Constants.ENTITY.SHC.toLowerCase()) {
                    lineMachine = false;
                    lineFresh = item.isFresh === true;
                } else {
                    lineMachine = item.isMachine === true;
                    lineFresh = item.isFresh === true;
                }

                const linePayload = {
                    productId: productId,
                    productName: productName,
                    productNameLc: productNameLc,
                    isMachine: lineMachine,
                    isFresh: lineFresh,
                    quantity: newQuantity,
                    unit: item.unit || 'EA',
                    unitPrice: unitPrice,
                    vatPercentage: vatPercentage || 0,
                    salesTaxAmount: vatAmount.toFixed(2),
                    netAmount: netAmount.toFixed(2),
                    lineNumber: lineNumber,
                    erpLineNumber: item.erplineNumber || lineNumber,
                    erpProdId: item.erpProdId || item.erpprodid || item.productCode || productId
                };

                orderLinesPayload.push(linePayload);
                lineNumber++;
            }

            // Check if we need to use temp table (entity !== 'vmco' && paymentMethod === 'pre payment')
            if (entity?.toLowerCase() !== Constants.ENTITY.VMCO.toLowerCase() && selectedPaymentMethod?.toLowerCase() === 'pre payment') {
                const tempOrderPayload = {
                    userId: userId,
                    entity: entity,
                    paymentMethod: selectedPaymentMethod,
                    totalAmount: finalTotalAmount.toFixed(2),
                    orderDetails: orderPayload,
                    orderLinesDetails: orderLinesPayload
                };

                const tempOrderResponse = await fetch(`${API_BASE_URL}/temp-sales-order`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(tempOrderPayload)
                });

                if (!tempOrderResponse.ok) {
                    const errorText = await tempOrderResponse.text();
                    throw new Error(JSON.parse(errorText)?.message || 'Failed to create temp order');
                }

                const tempOrderResult = await tempOrderResponse.json();
                const tempOrderId = tempOrderResult.data.id;

                try {
                    const paymentLinkResponse = await axios.post(`${API_BASE_URL}/generatePayment-link`, {
                        id: tempOrderId,
                        endPoint: 'payment-options/order',
                        IsEmail: false,
                        salesOrderType: "cart"
                    }, {
                        headers: {
                            'Authorization': `Bearer ${token}`
                        }
                    });
                    // Navigate to payment URL
                    if (paymentLinkResponse?.data?.details?.url) {
                        console.log('Payment link generated, redirecting to:', paymentLinkResponse.data.details.url);
                        window.location.href = paymentLinkResponse.data.details.url;

                        return tempOrderId; // Return temp order ID
                    } else {
                        throw new Error('Payment URL not found in response');
                    }

                } catch (error) {
                    console.error('Error generating payment link:', error);

                    // Delete temp order on error
                    try {
                        await fetch(`${API_BASE_URL}/temp-sales-order/flush/${tempOrderId}`, {
                            method: 'DELETE',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${token}`
                            }
                        });
                        console.log('Deleted temp order after error:', tempOrderId);
                    } catch (deleteError) {
                        console.error('Error deleting temp order:', deleteError);
                    }

                    Swal.fire({
                        icon: 'error',
                        title: t('Payment Link Error'),
                        text: t('Failed to generate payment link. Please try again.'),
                        confirmButtonText: t('OK')
                    });
                    return null;
                }

            } else {
                // Original flow for other cases (entity === 'vmco' or paymentMethod !== 'pre payment')
                console.log('Using original flow for entity:', entity, 'with payment method:', selectedPaymentMethod);

                // Call existing order creation logic
                return await createNormalOrder(orderPayload, orderLinesPayload, categoryItems, showSuccessMessage, categoryName, entity, selectedPaymentMethod);
            }

        } catch (err) {
            console.log('Error placing order:', err);
            setError(err.message);
            Swal.fire({
                icon: 'error',
                title: t('Order Failed'),
                text: t(`Failed to place order: ${err.message}`),
                confirmButtonText: t('OK')
            });
            return null;
        }
    };

    const createNormalOrder = async (orderPayload, orderLinesPayload, categoryItems, showSuccessMessage, categoryName, entity, selectedPaymentMethod) => {
        try {
            // Create the sales order
            const orderResponse = await fetch(`${API_BASE_URL}/sales-order`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(orderPayload)
            });

            if (!orderResponse.ok) {
                const errorText = await orderResponse.text();
                throw new Error(JSON.parse(errorText)?.message || 'Failed to create order');
            }

            const orderResult = await orderResponse.json();
            const orderId = orderResult.data.id;

            console.log('Created sales order with ID:', orderId);

            // Create order lines
            let lineNumber = 1;
            for (const linePayload of orderLinesPayload) {
                const lineWithOrderId = {
                    ...linePayload,
                    orderId: orderId,
                    lineNumber: lineNumber
                };

                const createResponse = await fetch(`${API_BASE_URL}/sales-order-lines`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(lineWithOrderId)
                });

                if (!createResponse.ok) {
                    const errorText = await createResponse.text();
                    console.error(`Failed to create line for product ${linePayload.productId}:`, errorText);
                    throw new Error(errorText);
                }

                const newLine = await createResponse.json();
                console.log(`Successfully created line for product ${linePayload.productId}:`, newLine);
                lineNumber++;
            }

            // Calculate totals for order update
            let linesTotal = 0;
            let totalSalesTaxAmount = 0;

            for (const line of orderLinesPayload) {
                const netAmount = parseFloat(line.netAmount || 0);
                const salesTaxAmount = parseFloat(line.salesTaxAmount || 0);

                if (!isNaN(netAmount)) {
                    linesTotal += netAmount;
                }
                if (!isNaN(salesTaxAmount)) {
                    totalSalesTaxAmount += salesTaxAmount;
                }
            }

            // Add delivery charges
            const deliveryCharges = parseFloat(orderPayload.deliveryCharges || 0);
            const finalTotalAmount = linesTotal + deliveryCharges;

            // Update order with correct totals
            const updateOrderPayload = {
                totalAmount: finalTotalAmount.toFixed(2),
                totalSalesTaxAmount: totalSalesTaxAmount.toFixed(2),
                deliveryCharges: deliveryCharges.toFixed(2)
            };

            const updateOrderResponse = await fetch(`${API_BASE_URL}/sales-order/id/${orderId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(updateOrderPayload)
            });

            if (!updateOrderResponse.ok) {
                console.error('Failed to update order totals, but order was created successfully');
            }

            // Delete from cart
            try {
                const cartCheckParams = new URLSearchParams({
                    pageSize: '10000'
                });

                const filters = {
                    userid: userId,
                    customerid: selectedCustomerId,
                    branchid: selectedBranchId,
                    entity: entity
                };

                cartCheckParams.append('filters', JSON.stringify(filters));

                const cartCheckResponse = await fetch(`${API_BASE_URL}/cart/pagination?${cartCheckParams.toString()}`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json',
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (cartCheckResponse.ok) {
                    const cartCheckResult = await cartCheckResponse.json();
                    const cartProducts = Array.isArray(cartCheckResult.data?.data) ? cartCheckResult.data.data : (Array.isArray(cartCheckResult.data) ? cartCheckResult.data : []);
                    if (cartProducts.length > 0) {
                        console.log(`Found ${cartProducts.length} items in cart, proceeding with deletion`);

                        const deleteUrl = new URL(`${API_BASE_URL}/cart/delete`);
                        deleteUrl.searchParams.append('customerid', selectedCustomerId);
                        deleteUrl.searchParams.append('branchid', selectedBranchId);
                        deleteUrl.searchParams.append('entity', entity);

                        const deleteResponse = await fetch(deleteUrl, {
                            method: 'DELETE',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${token}`
                            }
                        });

                        if (!deleteResponse.ok) {
                            console.error('Error removing cart items:', deleteResponse.statusText);
                        } else {
                            console.log('Successfully deleted cart items after order placement');
                        }
                    } else {
                        console.log('No items found in cart, skipping deletion');
                    }
                } else {
                    console.error('Error checking cart items:', cartCheckResponse.statusText);
                }
            } catch (err) {
                console.error('Error during cart check and cleanup:', err);
            }


            // Generate payment link for Pre Payment orders (non-VMCO entities)
            if (selectedPaymentMethod && selectedPaymentMethod.toLowerCase() === 'pre payment' &&
                entity && entity.toLowerCase() !== Constants.ENTITY.VMCO.toLowerCase()) {

                try {
                    const paymentLinkResponse = await axios.post(`${API_BASE_URL}/generatePayment-link`, {
                        id: orderId?.map(String).join(','),
                        endPoint: 'payment-options/order',
                        IsEmail: false,
                        salesOrderType: "cart"
                    }, {
                        headers: {
                            'Authorization': `Bearer ${token}`
                        }
                    });

                    if (paymentLinkResponse?.data?.details?.url) {
                        window.location.replace(paymentLinkResponse?.data?.details?.urlL)
                    }
                } catch (error) {
                    console.error('Error generating payment link:', error);
                }
            }

            // Show success message and update UI
            if (showSuccessMessage) {
                const orderStatusMessage = entity && entity.toLowerCase() === Constants.ENTITY.VMCO.toLowerCase()
                    ? t('Your request has been sent for approval!')
                    : t('Your order has been placed successfully!');

                Swal.fire({
                    icon: 'success',
                    title: entity && entity.toLowerCase() === Constants.ENTITY.VMCO.toLowerCase()
                        ? t('Request Sent')
                        : t('Order Placed'),
                    text: `${orderStatusMessage} Order: ${orderId}. Payment Method: ${selectedPaymentMethod}`,
                    confirmButtonText: t('OK')
                }).then(() => {
                    // Update cart items state to remove ordered items
                    setCartItems(prevCartItems =>
                        prevCartItems.map(category => ({
                            ...category,
                            items: category.items.filter(cartItem =>
                                !categoryItems.some(ci => ci.id === cartItem.id)
                            )
                        }))
                    );

                    setQuantities(prevQuantities => {
                        const newQuantities = { ...prevQuantities };
                        categoryItems.forEach(item => {
                            delete newQuantities[item.id];
                        });
                        return newQuantities;
                    });
                });
            }

            console.log('createNormalOrder completed - returning order ID:', orderId, 'for category:', categoryName);
            return orderId;

        } catch (error) {
            console.error('Error in createNormalOrder:', error);
            throw error;
        }
    };


    const isCreditPaymentAllowed = async (customerId, entity = null) => {
        try {
            const response = await fetch(`${API_BASE_URL}/payment-method-balances/id/${customerId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },

            });

            if (!response.ok) {
                console.error('Failed to fetch payment method details');
                return false;
            }

            const result = await response.json();
            console.log('Payment method details response:', result);

            if (result.status === 'Ok' && result.data && result.data.methodDetails) {
                const methodDetails = result.data.methodDetails;

                if (entity && methodDetails.credit && methodDetails.credit[entity]) {
                    const entityCreditDetails = methodDetails.credit[entity];
                    const isAllowed = entityCreditDetails.isAllowed === true;
                    console.log(`Credit payment is ${isAllowed ? 'allowed' : 'not allowed'} for entity ${entity}`);
                    return isAllowed;
                }

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

    const validateCreditBalance = async (customerId, totalAmount, entity = null) => {
        try {
            const response = await fetch(`${API_BASE_URL}/payment-method-balances/id/${customerId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    "Authorization": `Bearer ${token}`
                },

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
        if (cartItems?.length === 0) {
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
                    headers: {
                        'Content-Type': 'application/json',
                        "Authorization": `Bearer ${token}` // Include token for authentication
                    },

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


                setEntityDescriptions(result.data?.map(entity =>
                ({
                    descriptionLc: entity.descriptionLc,
                    description: entity.description,
                    value: entity.value

                })
                ));

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

        // setCartItems(items);
    };

    // Helper function to determine payment method for non-machine products
    const determinePaymentMethodForNonMachines = async (customerId, totalAmount, entity) => {
        try {
            const response = await fetch(`${API_BASE_URL}/payment-method-balances/id/${customerId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    "Authorization": `Bearer ${token}`
                },

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
                headers: {
                    'Content-Type': 'application/json',
                    "Authorization": `Bearer ${token}`
                },

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
                let deleteUrl = new URL(`${API_BASE_URL}/cart/delete?customer_id=${customerId}&branch_id=${branchId}&entity=${entity}`);
                // deleteUrl.searchParams.append('customer_id', customerId);
                // deleteUrl.searchParams.append('branch_id', branchId);
                // deleteUrl.searchParams.append('entity', entity);
                if (isFresh !== null && isFresh !== undefined) {
                    // deleteUrl.searchParams.append('isFresh', isFresh);
                    deleteUrl += `&isFresh=${isFresh}`
                }
                if (isMachine !== null && isMachine !== undefined) {
                    deleteUrl += `&isMachine=${isMachine}`
                    // deleteUrl.searchParams.append('isMachine', isMachine);
                }
                // deleteUrl.searchParams.append('product_id', product.product_id || product.productId);
                deleteUrl += `&product_id=${product.product_id || product.productId}`
                console.log(`Deleting cart item with params: ${deleteUrl}`);

                const deleteResponse = await fetch(deleteUrl, {
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },

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
                headers: {
                    'Content-Type': 'application/json',
                    "Authorization": `Bearer ${token}`
                },

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
                headers: {
                    'Content-Type': 'application/json',
                    "Authorization": `Bearer ${token}`
                },

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
    const getLocalizedEntityName = (categoryName, currentLanguage, entityDescriptions) => {
        console.log("getLocalizedEntityName called with:", { categoryName, currentLanguage, entityDescriptions });
        const match = entityDescriptions?.find(desc => desc.value.toLowerCase() === categoryName.toLowerCase());
        if (!match) return categoryName;
        return currentLanguage === "ar" ? match.descriptionLc || match.description : match.description;
    };
    return (
        <Sidebar title={t('Your Cart')} dir={t('direction')}>
            <div className="cart-header">
                <div className="delivery-info">
                    <span className="delivery-link">
                        {t("Delivering to")} {selectedBranchName !== "No location selected" ?
                            <strong>
                                {i18n.language === "en" ?
                                    (selectedBranchNameEn || selectedBranchName) :
                                    (selectedBranchNameLc || selectedBranchName)
                                }
                            </strong> :
                            <em>No location selected</em>
                        }
                    </span>
                </div>
            </div>
            <div className="cart-main-content">
                {isLoading ? (
                    <div className="loading-indicator">{t("Loading your cart items...")}</div>
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
                                        <h3>{getLocalizedEntityName(category.category, currentLanguage, entityDescriptions)}</h3>
                                    </div>
                                    <span className="category-count">{category.items.length} {t("Items")}</span>

                                    {/* Only show Place Order button when category is collapsed */}
                                    {collapsedCategories.has(category.category) && (
                                        <button
                                            className="checkout-btn"
                                            onClick={async (e) => {
                                                e.stopPropagation(); // Prevent triggering the header click
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
                                    )}
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
                                                            quantity={quantities[item.id] !== undefined ? quantities[item.id] : 0}
                                                            onQuantityChange={handleQuantityChange}
                                                            onInputChange={handleQuantityInputChange}  // Add this new handler
                                                            stopPropagation={true}
                                                            minQuantity={Number(item.moq) || 0}
                                                            moq={Number(item.moq) || 0}
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
                                                </span>
                                                <button
                                                    className="checkout-btn" onClick={async () => {
                                                        setPendingOrderCategory(category.category);
                                                        setPendingOrderItems(category.items);

                                                        const entity = getEntityFromCategory(category.category);
                                                        if (entity && (entity.toLowerCase() === Constants.ENTITY.VMCO.toLowerCase() ||
                                                            entity.toLowerCase() === Constants.ENTITY.SHC.toLowerCase())) {
                                                            // For VMCO and SHC, let handlePlaceOrder handle the payment method determination
                                                            handlePlaceOrder(category.items, category.category, null);
                                                        } else {
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