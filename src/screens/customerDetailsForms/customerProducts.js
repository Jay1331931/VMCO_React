import React, { useState, useRef, useEffect, useCallback } from 'react';
import Sidebar from '../../components/Sidebar';
import Pagination from '../../components/Pagination';
import '../../styles/pagination.css';
import '../../styles/components.css';
import '../../styles/forms.css';
import RbacManager from '../../utilities/rbac';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faToggleOff, faToggleOn, faCheck, faXmark } from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { debounce, set } from 'lodash';
import Constants from '../../constants';

function Products(customer) {
    const [isApprovalMode, setApprovalMode] = useState(false);
    const [products, setProducts] = useState([]); // all products
    const [currentItems, setCurrentItems] = useState([]); // products on current page
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isActionMenuOpen, setActionMenuOpen] = useState(false);
    const actionMenuRef = useRef(null);    const { t } = useTranslation();
    const categories = [Constants.ENTITY.VMCO, Constants.ENTITY.DIYAFA, Constants.ENTITY.GMTC, Constants.ENTITY.NAQI];
    const [activeCategory, setActiveCategory] = useState(Constants.ENTITY.VMCO);
    const [selectedItems, setSelectedItems] = useState([]);
    const [editingMoq, setEditingMoq] = useState(null);

    const [isInputFocused, setIsInputFocused] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;
    // const totalPages = Math.ceil(currentItems.length / itemsPerPage);
    const [totalPages, setTotalPages] = useState(0);
    const [pageInput, setPageInput] = useState('');
    const [search, setSearch] = useState('');
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;
        const { token, user, isAuthenticated, logout } = useAuth();
    // const currentItems = products.slice(startIndex, endIndex);
    const rbacMgr = new RbacManager(user?.userType == 'employee' && user?.roles[0] !== 'admin' ? user?.designation : user?.roles[0], 'custDetailsAdd');
        const isV = rbacMgr.isV.bind(rbacMgr);
        const isE = rbacMgr.isE.bind(rbacMgr);
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (actionMenuRef.current && !actionMenuRef.current.contains(event.target)) {
                setActionMenuOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);
 const fetchProducts = async () => {
            setLoading(true);
            setError(null);

            const filters = {
                customer_id: customer?.customer?.id,
                entity: activeCategory,
            };
if(isApprovalMode) {
                // If not in approval mode, add the visible filter
                filters.visible = true;
            } else {
                delete filters.visible; // Remove the visible filter if in approval mode
            }
            const query = new URLSearchParams({
                page: currentPage,
                pageSize: itemsPerPage,
                sortBy: "product_id",
                sortOrder: "asc",
                filters: JSON.stringify(filters),
                search: search
            });

            try {
                const response = await fetch(`${API_BASE_URL}/product-customer-mappings/pagination?${query.toString()}`, {
                    method: 'GET',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include'
                });

                if (!response.ok) {
                    throw new Error('Failed to fetch products');
                }

                const data = await response.json();
                setProducts(data.data); 
                setCurrentItems(data.data);
                setTotalPages(data.totalPages);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

    useEffect(() => {
       
        if (customer?.customer?.id && activeCategory) {
            fetchProducts();
        }
    }, [customer, activeCategory, currentPage, isApprovalMode, search]);

    const toggleApprovalMode = () => {
        setApprovalMode(!isApprovalMode);
        // fetchProducts();
    };


    const handleSelectAll = (e) => {
        if (e.target.checked) {
            const allIds = currentItems.map((item) => item.id);
            setSelectedItems(allIds);
            setCurrentItems(prevItems =>
                prevItems.map(item => ({ ...item, visible: true }))
            );
            callUpdateSelectedItemsAPI(allIds, true);
        } else {
            setSelectedItems([]);
            setCurrentItems(prevItems =>
                prevItems.map(item => ({ ...item, visible: false }))
            );
            callUpdateSelectedItemsAPI([], false);
        }
    };

    const handleSelectOne = (id) => {


        setSelectedItems((prevSelected) =>
            prevSelected.includes(id)
                ? prevSelected.filter((itemId) => itemId !== id)
                : [...prevSelected, id]
        );

    };

    const handleToggleVisibility = (id) => {
        setCurrentItems(prevItems =>
            prevItems.map(item =>
                item.id === id
                    ? { ...item, visible: !item.visible }
                    : item
            )
        );

        // Use the callback form to get the updated selectedItems
        setSelectedItems(prevSelected => {
            const newSelected = prevSelected.includes(id)
                ? [...prevSelected.filter(itemId => itemId !== id)]
                : [...prevSelected, id];
            console.log('Selected items:', newSelected);
            // Call API with the new selection
            callUpdateSelectedItemsAPI([id]);
            return newSelected;
        });
    };

    const callUpdateSelectedItemsAPI = async (selectedItems, state = false) => {
        console.log('current items:', currentItems);
        console.log('selected items:', selectedItems);
        try {
            let updatedItems;

            if (selectedItems.length === 0) {
                // When deselecting all, set all items to visible: false
                updatedItems = currentItems.map(item => ({
                    ...item,
                    visible: false
                }));
            } else if (state) {
                // When selecting all with state=true (select all case)
                updatedItems = currentItems.map(item => ({
                    ...item,
                    visible: true
                }));
            } else {
                // Toggle case for individual items
                updatedItems = currentItems.map(item => ({
                    ...item,
                    visible: selectedItems.includes(item.id) ? !item.visible : item.visible
                }));
            }

            console.log('Updating items with visibility:', updatedItems);

            const response = await fetch(`${API_BASE_URL}/product-customer-mappings`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedItems),
                credentials: 'include',
            });

            const data = await response.json();
            console.log('API response:', data);
        } catch (error) {
            console.error('Failed to update selected items:', error);
        }
    };
    const isAllSelected = currentItems.length > 0 && currentItems.every(item => item.visible);
    const handleMoqChange = (id, value) => {
        setCurrentItems(prevItems =>
            prevItems.map(item =>
                item.id === id
                    ? { ...item, moq: value }
                    : item
            )
        );
    };

    const handleSaveMoq = (id, value) => {
        console.log('save called');
        const product = currentItems.find(item => item.id === id);
        console.log('Saving MoQ:', value);
        try {
            const response = fetch(`${API_BASE_URL}/product-customer-mappings/${id}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ moq: value }),
                credentials: 'include'
            });

        } catch (error) {
            console.error('Error saving MoQ:', error);
        }


        setIsInputFocused(false);
        setEditingMoq(null);
    };

    const handleCancelMoq = (id) => {
        console.log('cancel called');
        const product = currentItems.find(item => item.id === id);
        const originalMoq = product?.originalMoq;
        handleMoqChange(id, originalMoq);
        handleSaveMoq(id, originalMoq);
        setIsInputFocused(false);
        setEditingMoq(null);
    };

    // Apply All: only for current page
    const handleApplyAll = () => {
        const moqValue = document.querySelector('.product-text-input').value;
        if (!moqValue) return;

        const numericValue = parseInt(moqValue);
        if (isNaN(numericValue)) return;

        // Only update visible items on the current page
        currentItems
            .filter(item => item.visible)
            .forEach(item => {
                handleMoqChange(item.id, numericValue);
                handleSaveMoq(item.id, numericValue);
            });
    };

    // Debounced search handler
    const handleSearchChange = debounce((e) => {
        setSearch(e.target.value);
        setCurrentPage(1);
    }, 400);

    return (
        <div className="products-content">
            <h3>{t("Products & MoQ - Company Name")}</h3>
            <div className="category-tabs">
                {categories.map((category) => (
                    <button
                        key={category}
                        className={`category-tab ${activeCategory === category ? 'active' : ''}`}
                        onClick={() => {setActiveCategory(category); setCurrentPage(1); fetchProducts();}}
                    >
                        {t(category)}
                    </button>
                ))}
            </div>
            <div className="products-page-header">
                <div className="products-header-controls">
                    <input
                        type="text"
                        placeholder={t('Search...')}
                        className="product-search-input"
                        onChange={handleSearchChange}
                        style={{padding:" 10px 15px",
    width: "300px",
    border: "2px solid #00205b",
    borderRadius:"8px",
    fontSize: "1rem",
    backgroundColor: "#fff",
    /* box-shadow: 0 0 0 2px #E5E4E2; */
    transition: "all 0.2s ease",
    marginRight: "10px",
    boxSizing: "border-box"}}
                    />
                    <div className="toggle-container">
                        <label>{t('All')}</label>
                        <FontAwesomeIcon
                            icon={isApprovalMode ? faToggleOn : faToggleOff}
                            className="product-toggle-icon"
                            onClick={toggleApprovalMode}
                            aria-label={isApprovalMode ? t('Switch to All Orders') : t('Switch to My Approvals')}
                        />
                        <label>{t('Selected')}</label>
                    </div>
                    <div className='toggle-container'>
                        {isV('btnApplyAll') && <label>{t('MoQ')}</label>}
                        {isV('btnApplyAll') && <input type='text' className='product-text-input' />}
                        {isV('btnApplyAll') && (
                            <button
                                className='branches-approve-button'
                                disabled={currentItems.filter(item => item.visible).length < 2}
                                onClick={handleApplyAll}
                            >
                                {t('Apply All')}
                            </button>
                        )}
                    </div>
                </div>
            </div>
            <div className="products-table-container">
                <table className="products-data-table">
                    <thead>
                        <tr>
                            <th className="checkbox-cell">
                                <input
                                    type="checkbox"
                                    checked={isAllSelected}
                                    onChange={handleSelectAll}
                                    disabled={isV('btnApplyAll')}
                                />
                            </th>
                            <th>{t("Name")}</th>
                            {isV('btnApplyAll') && (<th>{t("Minimum Order Quantity")}</th>)}
                        </tr>
                    </thead>
                    <tbody>
                        {currentItems.map((product) => (
                            <tr key={product.id}>
                                <td className="checkbox-cell">
                                    <input
                                        type="checkbox"
                                        checked={product.visible}
                                        onChange={() => handleToggleVisibility(product.id)}
                                        disabled={isV('btnApplyAll')}
                                    />
                                </td>
                                <td>{product.productName}</td>
                                {isV('btnApplyAll') && (<td className='edit-cell'>
                                    <div className="input-with-icons">
                                        <input
                                            type="text"
                                            value={product.moq}
                                            onChange={(e) => handleMoqChange(product.id, e.target.value)}
                                            onFocus={() => {
                                                setIsInputFocused(true);
                                                setEditingMoq(product.id);
                                            }}
                                            // onBlur={() => {
                                            //     // Use setTimeout to allow button clicks to register
                                            //     setTimeout(() => {
                                            //         setIsInputFocused(false);
                                            //         setEditingMoq(null);
                                            //     }, 200);
                                            // }}
                                            disabled={!isV('btnApplyAll')}
                                            style={{ width: '80px' }}
                                        />
                                        {isInputFocused && (
                                            <>
                                                <button className="icon-button" onClick={() => handleSaveMoq(product.id, product.moq)} onMouseDown={(e) => e.preventDefault()}><FontAwesomeIcon icon={faCheck} /></button>
                                                <button className="icon-button" onClick={() => handleCancelMoq(product.id)} onMouseDown={(e) => e.preventDefault()}><FontAwesomeIcon icon={faXmark} /></button>
                                            </>
                                        )}
                                    </div>
                                </td>)}
                            </tr>
                        ))}
                    </tbody>
                </table>
                {/* Pagination */}
            <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={(page) => { setCurrentPage(page); fetchProducts(); }}
            />
            </div>
            
            
        </div>
    );
}

export default Products;
