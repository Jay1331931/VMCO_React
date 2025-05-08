import React, { useState, useEffect } from 'react';
import '../styles/pagination.css';

const Pagination = ({ currentPage, totalPages, onPageChange, startIndex, endIndex, totalItems }) => {
    const [pageInput, setPageInput] = useState('1');

    // Sync input value when currentPage changes
    useEffect(() => {
        setPageInput(currentPage.toString());
    }, [currentPage]);
    
    const renderPageNumbers = () => {
        return Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter(page => Math.abs(currentPage - page) <= 2 || page === 1 || page === totalPages)
            .map((page, idx, arr) => (
                <React.Fragment key={page}>
                    {idx > 0 && page - arr[idx - 1] > 1 && <span className="dots">…</span>}
                    <button
                        onClick={() => onPageChange(page) }
                        className={page === currentPage ? 'active' : ''}
                    >
                        {page}
                    </button>
                </React.Fragment>
            ));
    };

    const handlePageJump = (e) => {
        if (e.key === 'Enter') {
            const pageNumber = Number(pageInput);
            if (pageNumber >= 1 && pageNumber <= totalPages) {
                onPageChange(pageNumber);
            }
            setPageInput(pageNumber);
        }
    };

    return (
        <div className='pagination-wrapper'>
            <div className="pagination-controls large-screen">
                <button onClick={() => onPageChange(1)} disabled={currentPage === 1}>«</button>
                <button onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1}>‹</button>

                {renderPageNumbers()}

                <button onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages}>›</button>
                <button onClick={() => onPageChange(totalPages)} disabled={currentPage === totalPages}>»</button>   
            </div>
            <div className="pagination-jump">
                    <label htmlFor="page-jump">Page:</label>
                    <input
                        id="page-jump"
                        type="number"
                        min="1"
                        max={totalPages}
                        value={pageInput}
                        onChange={(e) => setPageInput(e.target.value)}
                        onKeyDown={handlePageJump}
                        className="page-jump-input"
                    />
                    <span className="page-info">
                     of {totalPages} pages
                    </span>
                </div>
        </div>
    );
};

export default Pagination;
