import React from "react";
import { Grid, Typography, Button, Tooltip } from "@mui/material";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import VerifiedIcon from "@mui/icons-material/Verified";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
function BankTransactionsCard({ transactions, setSelectedRow, handleAddClick }) {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const handleTransactionClick = (txn) => setSelectedRow?.(txn);

  // 🎨 Status-based color styles
  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "approved":
        return "#CCF9E2";
      case "pending":
        return "#FCDF80";
      case "rejected":
        return "#F2D7D7";
      default:
        return "#E5E7EB";
    }
  };

  const getStatusTextColor = (status) => {
    switch (status?.toLowerCase()) {
      case "approved":
        return "#10472A";
      case "pending":
        return "#524906";
      case "rejected":
        return "#8D1A1A";
      default:
        return "#545454";
    }
  };

  const formatDate = (date) => {
    if (!date) return "";
    const d = new Date(date);
    return d.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  return (
   <div
  style={{
    fontSize: "12px",
    color: "#545454",
    height: "92%",
    position: "relative",
    padding: "10px"
  }}
>
  <Grid
    container
    spacing={1}
    sx={{
      width: "100%",
      pt: "1vh",
      justifyContent: "center",
    }}
  >
    {transactions?.length > 0 ? (
      transactions.map((txn) => (
        <Grid
          key={txn?.id}
          item
          xs={12}
          sm={6}
          md={4}
          onClick={() => handleTransactionClick(txn)}
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "stretch",
          }}
        >
          <Grid
            container
            sx={{
              borderRadius: "16px",
              backgroundColor: "white",
              border: "1px solid #D1D5DB",
              transition: "all 0.2s ease",
              cursor: "pointer",
              width: 340,
              boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
              ":hover": {
                transform: "translateY(-4px)",
                boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
              },
            }}
          >
            {/* Header */}
            <Grid
              item
              xs={12}
              sx={{
                backgroundColor: "#32a19f",
                color: "white",
                borderTopLeftRadius: "16px",
                borderTopRightRadius: "16px",
                px: 2,
                py: 1.2,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start", // Changed to flex-start for proper alignment
                minHeight: 80,
                maxHeight: "none", // Removed fixed maxHeight
                width: "100%",
                boxSizing: "border-box",
              }}
            >
              {/* Left side - Company Info */}
            <div
  style={{
    display: "flex",
    flexDirection: "column",
    flex: 1,
    marginRight: "8px",
    overflow: "hidden",
    height: "100%",
    justifyContent: "space-between",
    minWidth: 0, // Important for text overflow in flex containers
  }}
>
  <div style={{ flex: 1, minWidth: 0 }}>
    <Typography
      fontSize={14}
      fontWeight={600}
      sx={{
        lineHeight: 1.2,
        mb: 0.5,
        display: '-webkit-box',
        WebkitLineClamp: 2,
        WebkitBoxOrient: 'vertical',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
      }}
    >
      {i18n.language === "ar"
        ? txn?.companyNameAr || "Unknown Customer"
        : txn?.companyNameEn || "Unknown Customer"}
    </Typography>
  </div>
  <Typography 
    fontSize={12} 
    color="white" 
    sx={{ 
      opacity: 0.9,
      lineHeight: 1.2,
    }}
  >
    {`${t("Transaction Id")}: ${txn?.id || "-"}`}
  </Typography>
</div>

              {/* Right side - Status & Date */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-end",
                  justifyContent: "space-between",
                  minWidth: "90px",
                  flexShrink: 0,
                  height: "100%",
                }}
              >
                <Typography
                  sx={{
                    backgroundColor: getStatusColor(txn?.status),
                    color: getStatusTextColor(txn?.status),
                    borderRadius: "30px",
                    px: 1.5,
                    py: 0.3,
                    fontSize: 10,
                    fontWeight: 600,
                    whiteSpace: "nowrap",
                    textAlign: "center",
                    width: "fit-content",
                  }}
                >
                  {t(txn?.status) || t("N/A")}
                </Typography>
                <Typography
                  fontSize={11}
                  fontWeight={500}
                  color="white"
                  sx={{ 
                    mt: 0.3,
                    lineHeight: 1.2,
                  }}
                >
                  {txn?.createdAt}
                </Typography>
              </div>
            </Grid>

            {/* Body */}
            <Grid
              item
              xs={12}
              sx={{
                backgroundColor: "#f7f8fa",
                borderBottomLeftRadius: "16px",
                borderBottomRightRadius: "16px",
                px: 2,
                py: 1.2,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start", // Changed to flex-start
                minHeight: 80,
                maxHeight: "none", // Removed fixed maxHeight
                width: "100%",
              }}
            >
              {/* Left - Amount & Order Info */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  flex: 1,
                  marginRight: "8px",
                  height: "100%",
                  justifyContent: "space-between",
                }}
              >
                <Typography 
                  fontSize={12} 
                  color="#666"
                  sx={{ lineHeight: 1.3 }}
                >
                  {`${Number(txn?.amountTransferred || 0).toFixed(2)} ${t("SAR")}`}
                </Typography>
                <Typography 
                  fontSize={12} 
                  color="#666"
                  sx={{ lineHeight: 1.3 }}
                >
                  {`${txn?.orderId || "-"}`}
                </Typography>
                <Typography 
                  fontSize={12} 
                  color="#666"
                  sx={{ lineHeight: 1.3 }}
                >
                  {` ${txn?.erpOrderId || "-"}`}
                </Typography>
              </div>

              {/* Right - Additional Info */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-start",
                  justifyContent: "space-between",
                  minWidth: "90px",
                  flexShrink: 0,
                  height: "100%",
                }}
              >
                <Typography
                  fontSize={12}
                  color="#666"
                  sx={{ 
                    lineHeight: 1.3,
                    width: "100%",
                    wordBreak: "break-word",
                  }}
                >
                  {`${t("Created By")}: ${txn?.createdByName || "-"}`}
                </Typography>
                <Typography
                  fontSize={12}
                  color="#666"
                  sx={{ 
                    lineHeight: 1.3,
                    width: "100%",
                    wordBreak: "break-word",
                  }}
                >
                  {`${t("Business Unit")}: ${txn?.entity || "-"}`}
                </Typography>
                <Typography
                  fontSize={12}
                  color="#666"
                  sx={{ 
                    lineHeight: 1.3,
                    width: "100%",
                    wordBreak: "break-word",
                  }}
                >
                  {`${t("Region")}: ${
                    txn?.salesPersonRegion && txn.salesPersonRegion.length > 0 
                      ? txn.salesPersonRegion[0] 
                      : "-"
                  }`}
                </Typography>
              </div>
            </Grid>
          </Grid>
        </Grid>
      ))
    ) : (
      <Typography align="center" sx={{ mt: 2 }}>
        No transactions found
      </Typography>
    )}
  </Grid>
</div>
  );
}

export default BankTransactionsCard;
