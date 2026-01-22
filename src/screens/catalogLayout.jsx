import React, { useRef, useEffect, useState } from "react";
import ProductCard from "../components/ProductCard";
import LoadingSpinner from "../components/LoadingSpinner";
import SearchInput from "../components/SearchInput";
import SearchableDropdown from "../components/SearchableDropdown";
import Tabs from "../components/Tabs";
import ProductPopup from "../components/ProductPopup";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSearch, faTimes } from '@fortawesome/free-solid-svg-icons';
import { faShoppingCart } from "@fortawesome/free-solid-svg-icons";
import Constants from "../constants";
import { useTranslation } from "react-i18next";

const CatalogLayout = ({
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
    filteredCategoryTabs,
    activeCategory,
    handleTabChange,
    categoryFilter,
    handleCategoryFilterChange,
    categoryOptions,
    subCategoryFilter,
    handleSubCategoryFilterChange,
    subCategoryOptions,
    displayedProducts,
    mapProductToCardProps,
    quantities,
    setQuantities,
    handleQuantityChange,
    handleAddToCart,
    handleProductClick,
    onToggleFavorite,
    isLoading,
    isLoadingMore,
    hasMore,
    searchQuery,
    isAdding,
    selectedProduct,
    handleClosePopup,
    isRTL,
    dir,
    setSearchQuery,
    coolingPeriodData,
    disabledEntities,
    categoriesTabImages,

}) => {
    const { i18n } = useTranslation();
    const headerRef = useRef(null);
    const [headerHeight, setHeaderHeight] = useState(0);
    const [showSearch, setShowSearch] = useState(false);
    const dragStartY = useRef(0);

    // Calculate header height dynamically
    useEffect(() => {
        if (!isMobile) return; // Only run for mobile

        const updateHeight = () => {
            // Add null check here
            if (headerRef.current) {
                const height = headerRef.current.offsetHeight;
                setHeaderHeight(height);
            }
        };

        // Initial height calculation with small delay to ensure DOM is ready
        const timeoutId = setTimeout(updateHeight, 0);

        // Use ResizeObserver to track header size changes
        let resizeObserver;
        if (headerRef.current) {
            resizeObserver = new ResizeObserver(() => {
                // Add null check in callback
                if (headerRef.current) {
                    const height = headerRef.current.offsetHeight;
                    setHeaderHeight(height);
                }
            });
            resizeObserver.observe(headerRef.current);
        }

        // Also update on window resize
        window.addEventListener('resize', updateHeight);

        return () => {
            clearTimeout(timeoutId);
            if (resizeObserver) {
                resizeObserver.disconnect();
            }
            window.removeEventListener('resize', updateHeight);
        };
    }, [isMobile, activeCategory, categoryFilter, subCategoryFilter]);

    const renderWebLayout = () => (
        <div className="content" style={{ padding: "0px !important" }}>
            {/* <div className="home-page-desktop">
                <img src={"https://file.aiquickdraw.com/imgcompressed/img/compressed_824b7d7047e5ac0bf976723c2781c98e.webp"} className="left_image_desktop image_cover" alt="left_image"/>
                <div className="catalog_title">
                 
                </div>
                <div className="catalog_filters">
                    <div className="search-section">
                        <div className="search-div location-selector">
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
                        </div>
                    </div>
                </div> 
                <img src={"https://media-assets.swiggy.com/swiggy/image/upload/fl_lossy,f_auto,q_auto/portal/testing/seo-home/Sushi_replace.png"} className="right_image_desktop image_cover" alt="right_image"/>
            </div>
            <div className="entity-section">
                <div className="entity-cards">
                    <div className="entity-card">
                        <img src={"https://media-assets.swiggy.com/swiggy/image/upload/fl_lossy,f_auto,q_auto/MERCHANDISING_BANNERS/IMAGES/MERCH/2024/7/23/ec86a309-9b06-48e2-9adc-35753f06bc0a_Food3BU.png"} className="entity-image" alt="SHC Image" />
                    </div>
                    <div className="entity-card">
                        <img src={"https://media-assets.swiggy.com/swiggy/image/upload/fl_lossy,f_auto,q_auto/MERCHANDISING_BANNERS/IMAGES/MERCH/2024/7/23/ec86a309-9b06-48e2-9adc-35753f06bc0a_Food3BU.png"} className="entity-image" alt="SHC Image" />
                    </div>
                    <div className="entity-card">
                        <img src={"https://media-assets.swiggy.com/swiggy/image/upload/fl_lossy,f_auto,q_auto/MERCHANDISING_BANNERS/IMAGES/MERCH/2024/7/23/ec86a309-9b06-48e2-9adc-35753f06bc0a_Food3BU.png"} className="entity-image" alt="SHC Image" />
                    </div>
                    <div className="entity-card">
                        <img src={"https://media-assets.swiggy.com/swiggy/image/upload/fl_lossy,f_auto,q_auto/MERCHANDISING_BANNERS/IMAGES/MERCH/2024/7/23/ec86a309-9b06-48e2-9adc-35753f06bc0a_Food3BU.png"} className="entity-image" alt="SHC Image" />
                    </div>
                    <div className="entity-card">
                        <img src={"https://media-assets.swiggy.com/swiggy/image/upload/fl_lossy,f_auto,q_auto/MERCHANDISING_BANNERS/IMAGES/MERCH/2024/7/23/ec86a309-9b06-48e2-9adc-35753f06bc0a_Food3BU.png"} className="entity-image" alt="SHC Image" />
                    </div>
                    <div className="entity-card">
                        <img src={"https://media-assets.swiggy.com/swiggy/image/upload/fl_lossy,f_auto,q_auto/MERCHANDISING_BANNERS/IMAGES/MERCH/2024/7/23/ec86a309-9b06-48e2-9adc-35753f06bc0a_Food3BU.png"} className="entity-image" alt="SHC Image" />
                    </div>
                    <div className="entity-card">
                        <img src={"https://media-assets.swiggy.com/swiggy/image/upload/fl_lossy,f_auto,q_auto/MERCHANDISING_BANNERS/IMAGES/MERCH/2024/7/23/ec86a309-9b06-48e2-9adc-35753f06bc0a_Food3BU.png"} className="entity-image" alt="SHC Image" />
                    </div>

                </div>

            </div>  */}
            <div
                className={`catalog-wrapper${isRTL ? " rtl" : ""}`}
                style={{ direction: dir, textAlign: isRTL ? "right" : "left" }}
                dir={dir}
            >

                {activeCategory && (
                    <div className="catalog-fixed-header">
                        {isV("selectBranch") && isMobile && (
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

                        <div className="search-section">
                            <div className="search-container">
                                {isV("search") && (
                                    <SearchInput
                                        onSearch={setSearchQuery}
                                        debounceTime={500}
                                    />
                                )}

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
                                    onToggleFavorite={onToggleFavorite}
                                    onProductClick={() => handleProductClick(product)}
                                    isAdding={isAdding}
                                    isMobile={false}
                                />
                            ))
                        ) : (
                            !isLoading && !isLoadingMore && !hasMore && (
                                <div className="no-products-message" style={{ textAlign: "center", position: "absolute", top: "50%", width: "100%", justifySelf: "anchor-center" }}>
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
                        onToggleFavorite={onToggleFavorite}
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
            {activeCategory && (
                <div
                    ref={headerRef}
                    className={`catalog-fixed-header ${showHeader ? "show" : "show"}`}
                >
                    {isV("selectBranch") && (
                        <div
                            className="catalog-mobile-header"
                            style={{
                                display: "flex",
                                width: "100%",
                                alignItems: "center",
                                gap: "10px",
                                padding: "0 10px"
                            }}
                        >
                            <div className="branch-selector" style={{ flex: 1, minWidth: 0, width: '100%' }}>
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
                                    className="branch-location-select mobile"
                                    placeholder={t("Select Branch")}
                                    disabled={isBranchesLoading || branches.length === 0}
                                />
                            </div>
                            {isV("search") && (
                                <button
                                    className="search-toggle-btn"
                                    style={{
                                        flexShrink: 0,
                                        width: '40px',
                                        height: '40px',
                                        padding: '0',
                                        borderRadius: 'var(--border-radius)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        background: 'transparent',
                                        border: 'none',
                                        cursor: 'pointer',
                                        transition: 'all 0.3s ease'
                                    }}
                                    onClick={() => setShowSearch(!showSearch)}
                                >
                                    <FontAwesomeIcon
                                        icon={showSearch ? faTimes : faSearch}
                                        color="black"
                                        style={{ fontSize: '22px' }}
                                        className="search-icon"
                                    />
                                </button>
                            )}

                            {isV("goToCart") && (
                                <button
                                    className={`go-to-cart-btn ${!selectedLocation ? "disabled" : ""}`}
                                    style={{
                                        flexShrink: 0,
                                        opacity: !selectedLocation ? 0.6 : 1,
                                        cursor: !selectedLocation ? "not-allowed" : "pointer",
                                        width: '40px',
                                        height: '40px',
                                        padding: '0',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                    }}
                                    onClick={handleGoToCart}
                                    disabled={!selectedLocation}
                                >
                                    <FontAwesomeIcon icon={faShoppingCart} className="cart-icon" />
                                </button>
                            )}
                        </div>
                    )}

                    {/* Search bar - conditionally shown */}
                    {isV("search") && (
                        <div
                            className={`search-section ${showSearch ? 'search-open' : 'search-closed'}`}
                        >
                            <div className="search-container">
                                <SearchInput
                                    onSearch={setSearchQuery}
                                    debounceTime={500}
                                />
                            </div>
                        </div>
                    )}


                    <div className="filter-section">
                        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 12, overflowX: "auto", scrollbarWidth: "none" }}>
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

                    <div className="category-and-subcategory" style={{ display: "flex", flexDirection: "row", gap: "10px", justifyContent: "center", alignItems: "center", width: "100%", padding: "10px" }}>
                        <div className="category-dropdown-mobile" style={{ flex: 1 }}>
                            <SearchableDropdown
                                id={`category-filter-${catalogId}`}
                                name="categoryFilter"
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
                                id={`subcategory-filter-${catalogId}`}
                                name="subCategoryFilter"
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

            {/* Rest of your component remains exactly the same */}
            <div className="catalog-scrollable-content">
                <div
                    className="products-grid"
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '12px',
                        marginTop: '10px',
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
                                onToggleFavorite={onToggleFavorite}
                                onAddToCart={() => handleAddToCart(product.id)}
                                onProductClick={() => handleProductClick(product)}
                                isAdding={isAdding}
                                isMobile={true}
                            />
                        ))
                    ) : (
                        !isLoading && !isLoadingMore && !hasMore && (
                            <div className="no-products-message" style={{ textAlign: "center", position: "absolute", top: "50%", width: "100%", justifySelf: "anchor-center" }}>
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
                    onToggleFavorite={onToggleFavorite}
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
