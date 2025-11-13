import React from "react";
import { Grid, Typography, Button, Tooltip } from "@mui/material";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import VerifiedIcon from "@mui/icons-material/Verified";
import { useNavigate } from "react-router-dom";

function BankTransactionsCard({ transactions, setSelectedRow, handleAddClick }) {
  const navigate = useNavigate();

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
                    alignItems: "center",
                    minHeight: 80,
                    maxHeight: 80,
                    width: "100%",
                    boxSizing: "border-box",
                  }}
                >
                  {/* Left side */}
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      overflow: "hidden",
                      flex: 1,
                      marginRight: "8px",
                    }}
                  >
                    <Typography
                      fontSize={14}
                      fontWeight={600}
                      noWrap
                      title={txn?.companyNameEn || txn?.companyNameAr}
                    >
                      {txn?.companyNameEn || txn?.companyNameAr || "Unknown Customer"}
                    </Typography>
                    <Typography fontSize={12} color="white" sx={{ opacity: 0.9 }}>
                      Txn ID: {txn?.id || "-"}
                    </Typography>
                  </div>

                  {/* Right side */}
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "flex-end",
                      justifyContent: "center",
                      minWidth: "90px",
                      flexShrink: 0,
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
                      }}
                    >
                      {txn?.status || "N/A"}
                    </Typography>
                    <Typography
                      fontSize={11}
                      fontWeight={500}
                      color="white"
                      sx={{ mt: 0.3 }}
                    >
                      {formatDate(txn?.createdAt)}
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
                    alignItems: "center",
                    minHeight: 80,
                    maxHeight: 80,
                    width: "100%",
                  }}
                >
                  {/* Left */}
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      overflow: "hidden",
                      flex: 1,
                      marginRight: "8px",
                    }}
                  >
                    <Typography fontSize={13} fontWeight={600} color="#333">
                      Amount: {Number(txn?.amountTransferred || 0).toFixed(2)} SAR
                    </Typography>
                    <Typography fontSize={12} color="#666">
                      Order ID: {txn?.orderId || "-"}
                    </Typography>
                    <Typography fontSize={12} color="#666">
                      ERP Order: {txn?.erpOrderId || "-"}
                    </Typography>
                  </div>

                  {/* Right */}
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "flex-end",
                      justifyContent: "center",
                      minWidth: "90px",
                    }}
                  >
                    {/* <Tooltip title="View Transaction Details" arrow>
                      <Button
                        variant="contained"
                        size="small"
                        sx={{
                          backgroundColor: "#009688",
                          textTransform: "none",
                          fontSize: "12px",
                          borderRadius: "20px",
                          px: 2,
                          py: 0.6,
                          "&:hover": {
                            backgroundColor: "#00796B",
                          },
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/bankTransactions/edit/${txn?.id}`);
                        }}
                      >
                        <AccountBalanceIcon fontSize="small" sx={{ mr: 0.6 }} />
                        View
                      </Button>
                    </Tooltip> */}
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
