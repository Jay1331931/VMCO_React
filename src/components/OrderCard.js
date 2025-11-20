import { Button, Grid, Typography, Tooltip } from "@mui/material";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import React from "react";
import { useNavigate } from "react-router-dom";
import CustomToolbarMobile from "../components/CustomToolbarMobile";
import { useTranslation } from "react-i18next";
import Constants from "../constants";

function OrderCard({ orders, orderIds, setSelectedRow, handlePay, toolbarProps }) {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const handleOrderClick = (order) => setSelectedRow(order);

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

  // 📅 Formatters
  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatTime = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
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
      {/* Optional toolbar */}
      {/* <CustomToolbarMobile {...toolbarProps} /> */}

      <Grid
        container
        spacing={1}
        sx={{
          width: "100%",
          maxHeight: "90%",
        //   overflowY: "auto",
          pt: "1vh",
          justifyContent: "center",
        }}
      >
        {orders?.length > 0 ? (
          orders.map((order) => (
            <Grid
              key={order?.id}
              item
              xs={12}
              sm={6}
              md={4}
              onClick={() => handleOrderClick(order)}
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
                {/* ✅ Fixed Header */}
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
    width: "100%",          // ✅ force full width
    boxSizing: "border-box", // ✅ ensures padding doesn’t shrink width
  }}
>
  {/* Left Side */}
  <div
    style={{
      display: "flex",
      flexDirection: "column",
      overflow: "hidden",
      flex: 1,
      marginRight: "8px",
      width: "100%", // ✅ ensures left content spans fully if alone
    }}
  >
    <Typography
      fontSize={14}
      fontWeight={600}
      noWrap
      title={order?.branchNameEn || order?.companyNameEn}
      sx={{
        textOverflow: "ellipsis",
        overflow: "hidden",
        whiteSpace: "nowrap",
        width: "100%", // ✅ prevents shrinking when short text
      }}
    >
      {i18n.language === "ar" ? order?.branchNameLc || order?.companyNameAr || "Unknown Customer" : order?.branchNameEn || order?.companyNameEn || "Unknown Customer"}
    </Typography>
    <Typography
      fontSize={12}
      color="white"
      sx={{
        opacity: 0.9,
        textOverflow: "ellipsis",
        overflow: "hidden",
        whiteSpace: "nowrap",
        width: "100%", // ✅ ensures consistent full stretch
      }}
      title={order?.erpBranchId || order?.erpCustId}
    >
      {order?.erpBranchId || order?.erpCustId || "-"}
    </Typography>
  </div>

  {/* Right Side */}
  <div
    style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "flex-end",
      justifyContent: "center",
      minWidth: "90px",
      flexShrink: 0, // ✅ prevents right side from squeezing
    }}
  >
    <Typography
      sx={{
        backgroundColor: getStatusColor(order?.status),
        color: getStatusTextColor(order?.status),
        borderRadius: "30px",
        px: 1.5,
        py: 0.3,
        fontSize: 10,
        fontWeight: 600,
        whiteSpace: "nowrap",
      }}
    >
      {t(order?.status || "N/A")}
    </Typography>
    <Typography
      fontSize={11}
      fontWeight={500}
      sx={{ color: "white", mt: 0.3 }}
    >
      {formatTime(order?.createdAt)}
    </Typography>
    <Typography
      fontSize={11}
      fontWeight={500}
      color="white"
      sx={{ lineHeight: "12px" }}
    >
      {formatDate(order?.createdAt)}
    </Typography>
  </div>
</Grid>


                {/* Body */}
                <Grid
  item
  xs={12}
  sx={{
    // backgroundColor: "#3D5654",
    backgroundColor: "#f7f8fa",
    color: "white",
    // borderTopLeftRadius: "16px",
    // borderTopRightRadius: "16px",
    borderBottomLeftRadius: "16px",
    borderBottomRightRadius: "16px",
    px: 2,
    py: 1.2,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    minHeight: 80,
    maxHeight: 80,
    width: "100%",          // ✅ force full width
    boxSizing: "border-box", // ✅ ensures padding doesn’t shrink width
  }}
>
  {/* Left Side */}
  <div
    style={{
      display: "flex",
      flexDirection: "column",
      overflow: "hidden",
      flex: 1,
      marginRight: "8px",
      width: "100%", // ✅ ensures left content spans fully if alone
    }}
  >
<Grid item xs={12} sx={{ px: 2, py: 1.5 }}>
                  <Typography fontSize={14} fontWeight={600} color="textSecondary" >
                    {`${t("Order #")}${order?.id}`}
                  </Typography>

                  <Typography
                    fontSize={12}
                    color="textSecondary"
                    sx={{ mt: 0.3 }}
                  >
                    {t(order?.entity?.toUpperCase())}
                  </Typography>

                  <Typography
                    fontSize={12}
                    color="textSecondary"
                    sx={{ mt: 0.3 }}
                  >
                    {order?.erpOrderId}
                  </Typography>
                </Grid>
  </div>
        {/* Right Side */}
  <div
    style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "flex-end",
      justifyContent: "center",
      minWidth: "90px",
      flexShrink: 0, // ✅ prevents right side from squeezing
    }}
  >
    <Grid item xs={12} sx={{ px: 2, py: 1.5 }}>
                {/* Footer / Action */}
                <Typography
                    fontSize={14}
      fontWeight={600}
                    color="textSecondary"
                    sx={{ mt: 0.3 }}
                  >
                    {`${Number(order?.totalAmount || 0).toFixed(2)} ${t("SAR")}`}
                  </Typography>
                {( order?.status?.toLowerCase() !== "cancelled" &&
                            order?.status?.toLowerCase() !== "rejected" &&
                            order?.paymentMethod?.toLowerCase() != "cash on delivery" &&
                            order?.paymentMethod?.toLowerCase() !== "credit" &&
                            order?.paymentStatus?.toLowerCase() !== "paid" &&
                            ((order?.entity.toLowerCase() ===
                              Constants.ENTITY.VMCO.toLowerCase() &&
                              order?.status?.toLowerCase() === "approved") ||
                              (order?.status?.toLowerCase() === "open" &&
                                (order?.entity.toLowerCase() ===
                                  Constants.ENTITY.DAR.toLowerCase() ||
                                  order?.entity.toLowerCase() ===
                                  Constants.ENTITY.GMTC.toLowerCase() ||
                                  order?.entity.toLowerCase() ===
                                  Constants.ENTITY.SHC.toLowerCase())) ||
                              (order?.status?.toLowerCase() === "pending" &&
                                (order?.entity.toLowerCase() ===
                                  Constants.ENTITY.DAR.toLowerCase() ||
                                  order?.entity.toLowerCase() ===
                                  Constants.ENTITY.GMTC.toLowerCase() ||
                                  order?.entity.toLowerCase() ===
                                  Constants.ENTITY.SHC.toLowerCase() ||
                                  order?.entity.toLowerCase() ===
                                  Constants.ENTITY.NAQI.toLowerCase())))&&
                  order?.paymentMethod?.toLowerCase() === "pre payment" ) ? (
                  <Grid
                    item
                    xs={12}
                    sx={{
                      px: 2,
                      pb: 1.5,
                      display: "flex",
                      justifyContent: "flex-end"
                    }}
                  >
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
                        //   backgroundColor: "#2f4341",
                        },
                      }}
                      onClick={(e) => {
                        // e.stopPropagation();
                        // navigate(`/orders/${order?.id}/pay`, {
                        //   state: { order },
                        // });
                        handlePay(order, false, false)
                      }}
                    >
                      {/* <Tooltip title={("Pay")} arrow>
                                        <AccountBalanceWalletIcon />
                                      </Tooltip> */}
                                      {t("Pay")}
                    </Button>
                  </Grid>
                ) : (
                    <Typography
                    fontSize={12}
                    color="textSecondary"
                    sx={{ mt: 0.3 }}
                  >
                    {`${t("Payments")}: ${t(order?.paymentStatus) || t("N/A")}`}
                  </Typography>
                )}
                </Grid>
                </div>        
 </Grid>
              </Grid>
            </Grid>
          ))
        ) : (
          <Typography align="center" sx={{ mt: 2 }}>
            No orders found
          </Typography>
        )}
      </Grid>
    </div>
  );
}

export default OrderCard;
