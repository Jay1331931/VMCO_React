import React from "react";
import { Box, Card, CardContent, Typography, Button, Divider } from "@mui/material";
import CustomToolbarMobile from "./CustomToolbarMobile";
import { useTranslation } from "react-i18next";
import Pagination from "./Pagination";

const OrderCardsMobile = ({
  data = [],
  total,
  page,
  totalPages,
  onPageChange,
  searchQuery,
  setSearchQuery,
  filters,
  handleFilterChange,
  onSearch,
  filterAnchor,
  setFilterAnchor,
  filteredData,
  columnVisibilityModel,
  setColumnVisibilityModel,
  handleShowAllDetailsClick,
  isApprovalMode,
  handleAddOrder,
  HandleBulkOrderUpload,
  handleApproval,
  isV,
  t,
}) => {
  const { i18n } = useTranslation();

  return (
    <Box sx={{ padding: 1 }}>
      {/* ✅ Toolbar same as TableMobile */}
      <CustomToolbarMobile
  searchQuery={searchQuery}
  setSearchQuery={setSearchQuery}
  onSearch={onSearch}
  filters={filters}
  handleFilterChange={handleFilterChange}
  handleAddClick={handleAddOrder}
  handleUploadClick={HandleBulkOrderUpload}
  handleApproval={handleApproval}
  isV={isV}
  isApprovalMode={isApprovalMode}
/>
      {/* 🃏 Cards Layout */}
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 2 }}>
        {data.length === 0 ? (
          <Typography align="center" sx={{ mt: 4 }}>
            {t("No orders found")}
          </Typography>
        ) : (
          data.map((order) => (
            <Card
              key={order.id}
              variant="outlined"
              sx={{
                borderRadius: 2,
                boxShadow: "0px 1px 4px rgba(0,0,0,0.1)",
                padding: 1.5,
              }}
            >
              <CardContent>
                <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                    {t("Order #")}: {order.id}
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{
                      backgroundColor:
                        order.status?.toLowerCase() === "approved"
                          ? "#e6f4ea"
                          : order.status?.toLowerCase() === "pending"
                          ? "#fff8e1"
                          : "#f8d7da",
                      color:
                        order.status?.toLowerCase() === "approved"
                          ? "#256029"
                          : order.status?.toLowerCase() === "pending"
                          ? "#9a6b00"
                          : "#842029",
                      px: 1.5,
                      py: 0.3,
                      borderRadius: 1,
                      fontSize: "0.75rem",
                    }}
                  >
                    {t(order.status || "N/A")}
                  </Typography>
                </Box>

                <Typography variant="body2" sx={{ mt: 0.5 }}>
                  <b>{t("Customer")}:</b> {order.companyNameEn || "-"}
                </Typography>

                <Typography variant="body2">
                  <b>{t("Branch")}:</b> {order.branchNameEn || "-"}
                </Typography>

                <Typography variant="body2">
                  <b>{t("Entity")}:</b> {order.entity}
                </Typography>

                <Typography variant="body2">
                  <b>{t("Payment Status")}:</b> {order.paymentStatus}
                </Typography>

                <Typography variant="body2">
                  <b>{t("Total")}:</b>{" "}
{Number(order.totalAmount || 0).toFixed(2)}
                </Typography>

                <Divider sx={{ my: 1.5 }} />

                <Button
                  fullWidth
                  variant="contained"
                  sx={{
                    textTransform: "none",
                    fontSize: "0.85rem",
                    py: 0.8,
                    backgroundColor: "#009345",
                    "&:hover": { backgroundColor: "#007a39" },
                  }}
                  onClick={() => handleShowAllDetailsClick(order)}
                >
                  {t("View Details")}
                </Button>
              </CardContent>
            </Card>
          ))
        )}
      </Box>

      {/* 📄 Pagination */}
      {totalPages > 1 && (
        <Box sx={{ mt: 2 }}>
          <Pagination
            currentPage={page}
            totalPages={String(totalPages)}
            onPageChange={onPageChange}
          />
        </Box>
      )}
    </Box>
  );
};

export default OrderCardsMobile;
