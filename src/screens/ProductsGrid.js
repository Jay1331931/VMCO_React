import { Box, Grid, Typography } from "@mui/material"; // assuming your spinner component
import LoadingSpinner from "../components/LoadingSpinner";
import ProductCard from "../components/ProductCard";


export default function ProductsGrid({
  displayedProducts,
  isLoading,
  searchQuery,
  t,
  mapProductToCardProps,
  quantities,
  handleQuantityChange,
  handleAddToCart,
  handleProductClick,
  setQuantities,
  handleToggleFavorite
}) {
  return (
    <Box
      sx={{
        // width: "100%",
        width:{ xs: "350px", md: "100%" },
        overflowY: "auto", 
        padding: { xs: "12px", md: "20px" },
        display: "flex",
        flexWrap: "wrap",
        gap: "20px",
        justifyContent:  "flex-start" ,
        scrollBehavior: "smooth",
        boxSizing: "border-box",
      }}
    >
      {/* Product Cards */}
      {displayedProducts.length > 0 ? (
        displayedProducts.map((product) => (
          <Box
            key={product.id}
            sx={{
              flex: {
                xs: "1 1 calc(80% - 20px)",
                sm: "1 1 calc(50% - 20px)",
                md: "1 1 calc(25% - 20px)",
              },
              maxWidth: {
                xs: "calc(80% - 20px)",
                sm: "calc(50% - 20px)",
                md: "calc(25% - 20px)",
              },
              boxSizing: "border-box",
            }}
          >
            <ProductCard
              product={mapProductToCardProps(product)}
              quantities={quantities}
              onQuantityChange={handleQuantityChange}
              onAddToCart={() => handleAddToCart(product.id)}
              onProductClick={() => handleProductClick(product)}
              setQuantities={setQuantities}
              onToggleFavorite={handleToggleFavorite}
            />
          </Box>
        ))
      ) : !isLoading ? (
        <Box textAlign="center" width="100%">
          <Typography variant="body1">
            {searchQuery
              ? t('No products found matching your search term "{{searchTerm}}".', {
                  searchTerm: searchQuery,
                })
              : t("No products found matching your criteria.")}
          </Typography>
        </Box>
      ) : (
        <Box
          sx={{
            width: "100%",
            display: "flex",
            justifyContent: "center",
            paddingY: 4,
          }}
        >
          <LoadingSpinner size="medium" />
        </Box>
      )}
    </Box>
  );
}
