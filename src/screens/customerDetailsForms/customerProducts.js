import React, { useState, useRef, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import Pagination from '../../components/Pagination';
import '../../styles/pagination.css';
import '../../styles/components.css';
import '../../styles/forms.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faToggleOff, faToggleOn, faCheck, faXmark } from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from 'react-i18next';

const products = [
    { id: '0001', customer: 'XYZ', branch: 'JP Nagar', entity: 'Entity 1', paymentMethod: 'Credit', deliveryDate: '10 Apr 025', totalAmount: 'SAR2000', status: 'Pending' },
    { id: '0002', customer: 'XYZ', branch: 'JP Nagar', entity: 'Entity 1', paymentMethod: 'Credit', deliveryDate: '10 Apr 025', totalAmount: 'SAR2000', status: 'Pending' },
    { id: '0003', customer: 'XYZ', branch: 'JP Nagar', entity: 'Entity 1', paymentMethod: 'Credit', deliveryDate: '10 Apr 025', totalAmount: 'SAR2000', status: 'Pending' },
    { id: '0004', customer: 'XYZ', branch: 'JP Nagar', entity: 'Entity 1', paymentMethod: 'Credit', deliveryDate: '10 Apr 025', totalAmount: 'SAR2000', status: 'Approved' },
    { id: '0005', customer: 'XYZ', branch: 'JP Nagar', entity: 'Entity 1', paymentMethod: 'Credit', deliveryDate: '10 Apr 025', totalAmount: 'SAR2000', status: 'Rejected' },
    { id: '0006', customer: 'XYZ', branch: 'JP Nagar', entity: 'Entity 1', paymentMethod: 'Credit', deliveryDate: '10 Apr 025', totalAmount: 'SAR2000', status: 'Pending' },
    { id: '0007', customer: 'XYZ', branch: 'JP Nagar', entity: 'Entity 1', paymentMethod: 'Credit', deliveryDate: '10 Apr 025', totalAmount: 'SAR2000', status: 'Pending' },
    { id: '0008', customer: 'XYZ', branch: 'JP Nagar', entity: 'Entity 1', paymentMethod: 'Credit', deliveryDate: '10 Apr 025', totalAmount: 'SAR2000', status: 'Approved' },
    { id: '0009', customer: 'XYZ', branch: 'JP Nagar', entity: 'Entity 1', paymentMethod: 'Credit', deliveryDate: '10 Apr 025', totalAmount: 'SAR2000', status: 'Rejected' },
    { id: '0010', customer: 'XYZ', branch: 'JP Nagar', entity: 'Entity 1', paymentMethod: 'Credit', deliveryDate: '10 Apr 025', totalAmount: 'SAR2000', status: 'Pending' },
    { id: '0011', customer: 'XYZ', branch: 'JP Nagar', entity: 'Entity 1', paymentMethod: 'Credit', deliveryDate: '10 Apr 025', totalAmount: 'SAR2000', status: 'Pending' },
    { id: '0012', customer: 'XYZ', branch: 'JP Nagar', entity: 'Entity 1', paymentMethod: 'Credit', deliveryDate: '10 Apr 025', totalAmount: 'SAR2000', status: 'Approved' },
];

function Products() {
    const [isApprovalMode, setApprovalMode] = useState(false);
    const [isActionMenuOpen, setActionMenuOpen] = useState(false);
    const actionMenuRef = useRef(null);
    const { t } = useTranslation();
    const categories = ['VMCO Machines', 'VMCO Other', 'Diayafa', 'Green Mart', 'Naqui'];
    const [activeCategory, setActiveCategory] = useState('VMCO Machines');
    const [selectedItems, setSelectedItems] = useState([]);

    const [isInputFocused, setIsInputFocused] = useState(false);

    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;
    const totalPages = Math.ceil(products.length / itemsPerPage);
    const [pageInput, setPageInput] = useState('');
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentItems = products.slice(startIndex, endIndex);

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

    const toggleApprovalMode = () => {
        setApprovalMode(!isApprovalMode);
    };

    const handleSelectAll = (e) => {
        if (e.target.checked) {
            const allIds = currentItems.map((item) => item.id);
            setSelectedItems(allIds);
        } else {
            setSelectedItems([]);
        }
    };

    const handleSelectOne = (id) => {
        setSelectedItems((prevSelected) =>
            prevSelected.includes(id)
                ? prevSelected.filter((itemId) => itemId !== id)
                : [...prevSelected, id]
        );
    };

    const isAllSelected = currentItems.length > 0 && selectedItems.length === currentItems.length;


    return (
        <div className="products-content">
            <h3>Products & MoQ - Company Name</h3>
            <div className="category-tabs">
                {categories.map((category) => (
                    <button
                        key={category}
                        className={`category-tab ${activeCategory === category ? 'active' : ''}`}
                        onClick={() => setActiveCategory(category)}
                    >
                        {category}
                    </button>
                ))}
            </div>
            <div className="products-page-header">
                <div className="products-header-controls">
                    <input type="text" placeholder={t('Search...')} className="product-search-input" />
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
                        <label>{t('MoQ')}</label>
                        <input type='text' className='product-text-input' />
                        <button className='branches-approve-button'>Apply All</button>
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
                                />
                            </th>
                            <th>Name</th>
                            <th>Minimum Order Quantity</th>
                        </tr>
                    </thead>
                    <tbody>
                        {currentItems.map((product) => (
                            <tr key={product.id}>
                                <td className="checkbox-cell">
                                    <input
                                        type="checkbox"
                                        checked={selectedItems.includes(product.id)}
                                        onChange={() => handleSelectOne(product.id)}
                                    />
                                </td>
                                <td>{product.id} - {product.customer}</td>
                                <td className='edit-cell'>
                                    <div className="input-with-icons">
                                        <input
                                            type="text"
                                            defaultValue="30"
                                            onFocus={() => setIsInputFocused(true)}
                                            onBlur={() => setIsInputFocused(false)}
                                        />
                                        {isInputFocused && (
                                            <>
                                                <button className="icon-button"><FontAwesomeIcon icon={faCheck} /></button>
                                                <button className="icon-button"><FontAwesomeIcon icon={faXmark} /></button>
                                            </>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {/* Pagination */}
            <div className="pagination-controls large-screen">
                <button onClick={() => setCurrentPage(1)} disabled={currentPage === 1}>«</button>
                <button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1}>‹</button>

                {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter(page => Math.abs(currentPage - page) <= 2 || page === 1 || page === totalPages)
                    .map((page, idx, arr) => (
                        <React.Fragment key={page}>
                            {idx > 0 && page - arr[idx - 1] > 1 && <span className="dots">…</span>}
                            <button
                                onClick={() => setCurrentPage(page)}
                                className={page === currentPage ? 'active' : ''}
                            >
                                {page}
                            </button>
                        </React.Fragment>
                    ))}

                <button onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages}>›</button>
                <button onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages}>»</button>
                <div className="pagination-jump">
                    <label htmlFor="page-jump">Page:</label>
                    <input
                        id="page-jump"
                        type="number"
                        min="1"
                        max={totalPages}
                        value={pageInput}
                        onChange={(e) => setPageInput(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                const pageNumber = Number(pageInput);
                                if (pageNumber >= 1 && pageNumber <= totalPages) {
                                    setCurrentPage(pageNumber);
                                }
                                setPageInput('');
                            }
                        }}
                        className="page-jump-input"
                    />
                </div>

                <span className="page-info">
                    {startIndex + 1}-{Math.min(endIndex, products.length)} of {products.length} items
                </span>
            </div>
        </div>
    );
}

export default Products;
