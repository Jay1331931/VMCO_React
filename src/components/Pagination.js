import React, { useState, useEffect } from "react";
import "../styles/pagination.css";
import "../i18n";
import { useTranslation } from "react-i18next";

const Pagination = ({
  currentPage,
  totalPages,
  onPageChange,
  startIndex,
  endIndex,
  totalItems,
}) => {
  const { t } = useTranslation();
  const [pageInput, setPageInput] = useState("1");

  // Sync input value when currentPage changes
  useEffect(() => {
    setPageInput(currentPage.toString());
  }, [currentPage]);

  const renderPageNumbers = () => {
    return Array.from({ length: totalPages }, (_, i) => i + 1)
      .filter(
        (page) =>
          Math.abs(currentPage - page) <= 2 || page === 1 || page === totalPages
      )
      .map((page, idx, arr) => (
        <React.Fragment key={page}>
          {idx > 0 && page - arr[idx - 1] > 1 && (
            <span className="dots">…</span>
          )}
          <button
            onClick={() => onPageChange(page)}
            className={page === currentPage ? "active" : ""}
          >
            {page}
          </button>
        </React.Fragment>
      ));
  };

  const handlePageJump = (e) => {
    const pageNumber = Number(e.target.value);
    setPageInput(e.target.value);
    if (pageNumber >= 1 && pageNumber <= totalPages) {
      onPageChange(pageNumber);
    }
  };

  return (
    <div className="pagination-wrapper">
      <div className="pagination-controls large-screen">
        <button onClick={() => onPageChange(1)} disabled={currentPage === 1}>
          «
        </button>
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
        >
          ‹
        </button>

        {renderPageNumbers()}

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === Number(totalPages)}
        >
          ›
        </button>
        <button
          onClick={() => onPageChange(Number(totalPages))}
          disabled={currentPage === Number(totalPages)}
        >
          »
        </button>
      </div>
      <div className="pagination-jump">
        <label htmlFor="page-jump">{t("Page:")}</label>
        <input
          id="page-jump"
          type="number"
          min="1"
          max={totalPages}
          value={pageInput}
          onChange={handlePageJump}
          className="page-jump-input"
        />
        <span className="page-info">{t("of")} {totalPages} {t("pages")}</span>
      </div>
      <style>{`
                .pagination-wrapper {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 10px;
                    margin: 24px 0 0 0;
                }
                .pagination-controls {
                    display: flex;
                    align-items: center;
                    gap: 4px;
                }
                .pagination-controls button {
                    background: #fff;
                    border: 1px solid #ddd;
                    color: #222;
                    font-size: 1rem;
                    padding: 7px 13px;
                    border-radius: 6px;
                    cursor: pointer;
                    margin: 0 2px;
                    transition: background 0.15s, border 0.15s;
                }
                .pagination-controls button.active,
                .pagination-controls button:active {
                    background: #0a5640;
                    color: #fff;
                    border: 1.5px solid #0a5640;
                }
                .pagination-controls button:disabled {
                    background: #f5f5f5;
                    color: #aaa;
                    border: 1px solid #eee;
                    cursor: not-allowed;
                }
                .pagination-controls .dots {
                    padding: 0 6px;
                    color: #888;
                    font-size: 1.1rem;
                }
                .pagination-jump {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    margin-top: 4px;
                }
                .pagination-jump label {
                    font-size: 1rem;
                    color: #222;
                }
                .page-jump-input {
                    width: 48px;
                    padding: 6px 8px;
                    border-radius: 6px;
                    border: 1.5px solid #ddd;
                    font-size: 1rem;
                    color: #222;
                    outline: none;
                    transition: border 0.2s;
                }
                .page-jump-input:focus {
                    border: 1.5px solid #0a5640;
                }
                .page-info {
                    font-size: 1rem;
                    color: #555;
                }
                @media (max-width: 768px) {
                    .pagination-wrapper {
                        margin: 16px 0 0 0;
                    }
                    .pagination-controls button {
                        font-size: 0.78rem;
                        padding: 4px 5px;
                    }
                    .pagination-jump label,
                    .page-info {
                        font-size: 0.8rem;
                    }
                        .page-jump-input {
                        padding: 3px 4px;
                        width: 30px;
                        }
                        .pagination-jump {
                        margin-bottom: 5px;
      }
                }
            `}</style>
    </div>
  );
};

export default Pagination;
