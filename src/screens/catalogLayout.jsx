import React from "react";
import ProductCard from "../components/ProductCard";
import LoadingSpinner from "../components/LoadingSpinner";
import SearchInput from "../components/SearchInput";
import SearchableDropdown from "../components/SearchableDropdown";
import Tabs from "../components/Tabs";
import ProductPopup from "../components/ProductPopup";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faShoppingCart } from "@fortawesome/free-solid-svg-icons";
import Constants from "../constants";
import { useTranslation } from "react-i18next";

const CatalogLayout = ({
    // Header section props
    isMobile,
    showHeader,
    selectedLocation,
    handleBranchSelect,
    branches,
    isBranchesLoading,
    catalogId,
    isV,
    handleGoToCart,
    t,

    // Filter section props
    filteredCategoryTabs,
    activeCategory,
    handleTabChange,

    // Search section props
    categoryFilter,
    handleCategoryFilterChange,
    categoryOptions,
    subCategoryFilter,
    handleSubCategoryFilterChange,
    subCategoryOptions,

    // Products section props
    displayedProducts,
    mapProductToCardProps,
    quantities,
    setQuantities,
    handleQuantityChange,
    handleAddToCart,
    handleProductClick,
    isLoading,
    isLoadingMore,
    hasMore,
    searchQuery,
    isAdding,

    // Product popup props
    selectedProduct,
    handleClosePopup,

    // Platform & RTL props
    isRTL,
    dir
}) => {
    const { i18n } = useTranslation();

    const renderWebLayout = () => (
        <div className="content" style={{ padding: "0px !important" }}>
            <div
                className={`catalog-wrapper${isRTL ? " rtl" : ""}`}
                style={{ direction: dir, textAlign: isRTL ? "right" : "left" }}
                dir={dir}
            >
                {/* Desktop Fixed Header Container */}
                {activeCategory && (
                    <div className="catalog-fixed-header">
                        {/* Location Selector and Cart Button */}
                        {isV("selectBranch") && (
                            <div className="catalog-header">
                                <div className="location-selector">
                                    <SearchableDropdown
                                        id={`location-select-${catalogId}`}
                                        name="locationSelect"
                                        value={selectedLocation}
                                        onChange={handleBranchSelect}
                                        options={branches.map((b) => ({
                                            ...b,
                                            name: b.label || b.name || b.value,
                                            disabled: b.disabled,
                                        }))}
                                        className="location-select"
                                        placeholder={t("Select Branch")}
                                        disabled={isBranchesLoading || branches.length === 0}
                                    />
                                    {isBranchesLoading && branches.length === 0 && (
                                        <div className="dropdown-loading">
                                            <LoadingSpinner size="small" />
                                        </div>
                                    )}
                                    {!isBranchesLoading && branches.length === 0 && (
                                        <div className="no-branches-message">
                                            {t("No branches available")}
                                        </div>
                                    )}
                                </div>
                                {isV("goToCart") && (
                                    <button
                                        className={`go-to-cart-btn ${!selectedLocation ? "disabled" : ""}`}
                                        style={{
                                            opacity: !selectedLocation ? 0.6 : 1,
                                            cursor: !selectedLocation ? "not-allowed" : "pointer",
                                        }}
                                        onClick={handleGoToCart}
                                        disabled={!selectedLocation}
                                    >
                                        <FontAwesomeIcon icon={faShoppingCart} className="cart-icon" />
                                        {window.innerWidth >= 350 && <span>{t("Go to Cart")}</span>}
                                    </button>
                                )}
                            </div>
                        )}

                        {/* Filter section */}
                        <div className="filter-section">
                            <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 12, overflowX: "auto", scrollbarWidth: "none" }}>
                                <Tabs
                                    tabs={filteredCategoryTabs}
                                    activeTab={activeCategory}
                                    onTabChange={handleTabChange}
                                    className=""
                                    variant="pc"
                                    catalog="true"
                                />
                            </div>
                        </div>

                        {/* Search section */}
                        <div className="search-section">
                            <div className="search-container">
                                {isV("search") && (
                                    <SearchInput
                                        onSearch={() => { }}
                                        debounceTime={500}
                                    />
                                )}

                                {/* Wrapper for dropdowns on same line */}
                                <div style={{
                                    display: 'flex',
                                    gap: '10px',
                                    width: '100%',
                                    ...(window.innerWidth <= 425 && window.innerWidth > 375 ? {} : {})
                                }}>
                                    <SearchableDropdown
                                        id={`category-filter-${catalogId}`}
                                        name="categoryFilter"
                                        options={categoryOptions}
                                        className={window.innerWidth <= 375 ? "category-filter-double" : "category-filter"}
                                        placeholder={t("Category")}
                                        value={categoryFilter}
                                        onChange={handleCategoryFilterChange}
                                    />
                                    <SearchableDropdown
                                        id={`subcategory-filter-${catalogId}`}
                                        name="subCategoryFilter"
                                        options={subCategoryOptions}
                                        className={window.innerWidth <= 375 ? "category-filter-double" : "category-filter"}
                                        placeholder={!categoryFilter ? t("Select category first") : t("Sub category")}
                                        value={subCategoryFilter}
                                        onChange={handleSubCategoryFilterChange}
                                        disabled={!categoryFilter || subCategoryOptions.length === 0}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Desktop Scrollable Products Container */}
                <div className="catalog-scrollable-content">
                    <div className="products-grid">
                        {displayedProducts?.length > 0 ? (
                            displayedProducts.map((product) => (
                                <ProductCard
                                    key={product.id}
                                    product={mapProductToCardProps(product)}
                                    quantities={quantities}
                                    setQuantities={setQuantities}
                                    onQuantityChange={handleQuantityChange}
                                    onAddToCart={() => handleAddToCart(product.id)}
                                    onProductClick={() => handleProductClick(product)}
                                    isAdding={isAdding}
                                    isMobile={false}
                                />
                            ))
                        ) : (
                            !isLoading && !isLoadingMore && !hasMore && (
                                <div className="no-products-message">
                                    {searchQuery ? (
                                        <p>{t("No products found matching your search term")}</p>
                                    ) : (
                                        <p>{t("No products found matching your criteria.")}</p>
                                    )}
                                </div>
                            )
                        )}

                        {isLoading && (
                            <div
                                className="loading-container"
                                style={{ position: "absolute", top: "50%", left: "50%" }}
                            >
                                <LoadingSpinner size="medium" />
                            </div>
                        )}
                    </div>

                    {isLoadingMore && (
                        <div className="loading-more-container">
                            <LoadingSpinner size="medium" />
                            <span className="loading-more-text">{t("Loading more products...")}</span>
                        </div>
                    )}

                    {!hasMore && displayedProducts?.length > 0 && !isLoading && !isLoadingMore && (
                        <div className="end-of-catalog-message">
                            <p>{t("End of product catalog")}</p>
                        </div>
                    )}
                </div>

                {selectedProduct && (
                    <ProductPopup
                        product={mapProductToCardProps(selectedProduct)}
                        quantities={quantities}
                        onQuantityChange={handleQuantityChange}
                        onAddToCart={() => handleAddToCart(selectedProduct.id)}
                        onClose={handleClosePopup}
                        isAdding={isAdding}
                    />
                )}
            </div>
        </div>
    );

    const renderMobileLayout = () => (
        <div>
            {/* Mobile Fixed Header Container */}
            {activeCategory && (
                <div className={`catalog-fixed-header ${showHeader ? "show" : "hide"}`}>
                    {/* Location Selector and Cart Button */}
                    {isV("selectBranch") && (
                        <div
                            className="catalog-mobile-header"
                            style={{
                                display: "flex",
                                width: "100%",
                                alignItems: "center",
                                gap: "10px",
                            }}
                        >
                            <div className="branch-selector" style={{ flex: 1, minWidth: 0 }}>
                                <SearchableDropdown
                                    id={`location-select-${catalogId}`}
                                    name="locationSelect"
                                    value={selectedLocation}
                                    onChange={handleBranchSelect}
                                    options={branches.map((b) => ({
                                        ...b,
                                        name: b.label || b.name || b.value || "",
                                        disabled: b.disabled,
                                    }))}
                                    className="mobile-select-branch"
                                    placeholder={t("Select Branch")}
                                    disabled={isBranchesLoading || branches.length === 0}
                                    style={{
                                        width: "100% !important",
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "center",
                                        padding: "8px 12px",
                                        border: "1px solid #ccc",
                                        borderRadius: "8px",
                                        backgroundColor: "white",
                                        cursor: "pointer",
                                        minHeight: "38px",
                                        fontSize: "12px",
                                        position: "relative",
                                        zIndex: 0,
                                    }}
                                />
                            </div>
                            {isV("goToCart") && (
                                <button
                                    className={`go-to-cart-btn ${!selectedLocation ? "disabled" : ""}`}
                                    style={{
                                        flexShrink: 0,
                                        opacity: !selectedLocation ? 0.6 : 1,
                                        cursor: !selectedLocation ? "not-allowed" : "pointer",
                                    }}
                                    onClick={handleGoToCart}
                                    disabled={!selectedLocation}
                                >
                                    <FontAwesomeIcon icon={faShoppingCart} className="cart-icon" />
                                </button>
                            )}
                        </div>
                    )}
                    {/* Search section */}
                    <div className="search-section">
                        <div className="search-container">
                            {isV("search") && (
                                <SearchInput
                                    onSearch={() => { }}
                                    debounceTime={500}
                                />
                            )}
                        </div>
                    </div>
                    {/* Filter section */}
                    <div className="filter-section">
                        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 12, overflowX: "auto", marginBottom: "10px", scrollbarWidth: "none" }}>
                            <Tabs
                                tabs={filteredCategoryTabs}
                                activeTab={activeCategory}
                                onTabChange={handleTabChange}
                                className="catalog"
                                variant="mobile"
                                catalog="true"
                            />
                        </div>
                    </div>

                    <div className="category-and-subcategory" style={{ display: "flex", flexDirection: "row", gap: "10px", justifyContent: "center", alignItems: "center", width: "100%" }}>
                        <div className="category-dropdown-mobile" style={{ flex: 1 }}>
                            <SearchableDropdown
                                options={categoryOptions}
                                className="category-filter-mobile"
                                style={{ width: '100%', borderRadius: '16px' }}
                                placeholder={t("Category")}
                                value={categoryFilter}
                                onChange={handleCategoryFilterChange}
                            />
                        </div>
                        <div className="subcategory-dropdown" style={{ flex: 1 }}>
                            <SearchableDropdown
                                options={subCategoryOptions}
                                className="subcategory-filter-mobile"
                                style={{ width: '100%', borderRadius: '16px' }}
                                placeholder={!categoryFilter ? t("Select category first") : t("Sub category")}
                                value={subCategoryFilter}
                                onChange={handleSubCategoryFilterChange}
                                disabled={!categoryFilter || subCategoryOptions.length === 0}
                            />
                        </div>
                    </div>
                </div>
            )}


            {/* Mobile Scrollable Products Container */}
            <div className="catalog-scrollable-content" style={{ paddingTop: "10px" }}>
                <div
                    className="products-grid"
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '12px',
                        marginTop: '20px',
                        width: '100%'
                    }}
                >
                    {displayedProducts?.length > 0 ? (
                        displayedProducts.map((product) => (
                            <ProductCard
                                key={product.id}
                                product={mapProductToCardProps(product)}
                                quantities={quantities}
                                setQuantities={setQuantities}
                                onQuantityChange={handleQuantityChange}
                                onAddToCart={() => handleAddToCart(product.id)}
                                onProductClick={() => handleProductClick(product)}
                                isAdding={isAdding}
                                isMobile={true}
                            />
                        ))
                    ) : (
                        !isLoading && !isLoadingMore && !hasMore && (
                            <div className="no-products-message">
                                {searchQuery ? (
                                    <p>{t("No products found matching your search term")}</p>
                                ) : (
                                    <p>{t("No products found matching your criteria.")}</p>
                                )}
                            </div>
                        )
                    )}
                </div>

                {isLoading && (
                    <div
                        className="loading-container"
                        style={{ position: "absolute", top: "50%", left: "50%" }}
                    >
                        <LoadingSpinner size="medium" />
                    </div>
                )}

                {isLoadingMore && (
                    <div className="loading-more-container">
                        <LoadingSpinner size="medium" />
                        <span className="loading-more-text">{t("Loading more products...")}</span>
                    </div>
                )}

                {!hasMore && displayedProducts?.length > 0 && !isLoading && !isLoadingMore && (
                    <div className="end-of-catalog-message">
                        <p>{t("End of product catalog")}</p>
                    </div>
                )}
            </div>

            {selectedProduct && (
                <ProductPopup
                    product={mapProductToCardProps(selectedProduct)}
                    quantities={quantities}
                    onQuantityChange={handleQuantityChange}
                    onAddToCart={() => handleAddToCart(selectedProduct.id)}
                    onClose={handleClosePopup}
                    isAdding={isAdding}
                />
            )}
        </div>
    );

    return isMobile ? renderMobileLayout() : renderWebLayout();
};

export default CatalogLayout;
