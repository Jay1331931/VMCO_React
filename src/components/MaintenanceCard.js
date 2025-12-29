import React from "react";
import { Grid, Typography, Button, Tooltip } from "@mui/material";
import BuildIcon from "@mui/icons-material/Build";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
function MaintenanceCard({
  tickets,
  setSelectedRow,
  handleViewDetails,
  handleAdd,
}) {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const handleTicketClick = (ticket) => setSelectedRow(ticket);

  // 🎨 Status-based colors
  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "closed":
        return "#CCF9E2";
      case "in progress":
        return "#FCDF80";
      case "rejected":
        return "#F2D7D7";
      default:
        return "#E5E7EB";
    }
  };

  const getStatusTextColor = (status) => {
    switch (status?.toLowerCase()) {
      case "closed":
        return "#10472A";
      case "in progress":
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
        padding:"10px"
      }}
    >
      <Grid
        container
        spacing={1}
        sx={{
          width: "100%",
          maxHeight: "90%",
          pt: "1vh",
          justifyContent: "center",
        }}
      >
        {tickets?.length > 0 ? (
          tickets.map((ticket) => (
            <Grid
              key={ticket?.id}
              item
              xs={12}
              sm={6}
              md={4}
              onClick={() => handleTicketClick(ticket)}
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
                {/* ✅ Header */}
                <Grid
                  item
                  xs={12}
                  sx={{
                    backgroundColor: "var(--logo-cyan)",
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
                  {/* Left Side */}
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      overflow: "hidden",
                      flex: 1,
                      marginRight: "8px",
                      width: "100%",
                    }}
                  >
                    <Typography
                      fontSize={14}
                      fontWeight={600}
                      noWrap
                      title={ticket?.companyNameEn || ticket?.companyNameAr}
                      sx={{
                        textOverflow: "ellipsis",
                        overflow: "hidden",
                        whiteSpace: "nowrap",
                        width: "100%",
                      }}
                    >
                      {i18n.language === "ar"
                        ? ticket?.companyNameAr || "Unknown Customer"
                        : ticket?.companyNameEn || "Unknown Customer"}
                    </Typography>
                    {/* <Typography
                      fontSize={12}
                      color="white"
                      sx={{
                        opacity: 0.9,
                        textOverflow: "ellipsis",
                        overflow: "hidden",
                        whiteSpace: "nowrap",
                        width: "100%",
                      }}
                      title={ticket?.erpCustomerId}
                    >
                      ERP ID: {ticket?.erpCustomerId || "-"}
                    </Typography> */}
                  </div>

                  {/* Right Side */}
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
                        backgroundColor: getStatusColor(ticket?.status),
                        color: getStatusTextColor(ticket?.status),
                        borderRadius: "30px",
                        px: 1.5,
                        py: 0.3,
                        fontSize: 10,
                        fontWeight: 600,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {t(ticket?.status) || t("N/A")}
                    </Typography>
                    <Typography fontSize={11} fontWeight={500} color="white">
                      {formatDate(ticket?.createdAt)}
                    </Typography>
                  </div>
                </Grid>

                {/* Body */}
                <Grid
                  item
                  xs={12}
                  sx={{
                    backgroundColor: "#f7f8fa",
                    color: "#333",
                    borderBottomLeftRadius: "16px",
                    borderBottomRightRadius: "16px",
                    px: 2,
                    py: 1.5,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    width: "100%",
                    boxSizing: "border-box",
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
                    }}
                  >
                    <Typography
                      fontSize={14}
                      fontWeight={600}
                      color="textSecondary"
                    >
                      {`${t("Request #")}${ticket?.requestId}`}
                    </Typography>
                    <Typography
                      fontSize={12}
                      color="textSecondary"
                      sx={{ mt: 0.3 }}
                    >
                      {`${t("Issue Name")}: ${ticket?.issueName || "-"}`}
                    </Typography>
                    <Typography
                      fontSize={12}
                      color="textSecondary"
                      sx={{ mt: 0.3 }}
                    >
                      {`${t("Issue Type")}: ${ticket?.issueType || "-"}`}
                    </Typography>
                    <Typography
                      fontSize={12}
                      color="textSecondary"
                      sx={{ mt: 0.3 }}
                    >
                      {`${t("Urgency Level")}: ${
                        ticket?.urgencyLevel || t("Normal")
                      }`}
                    </Typography>
                  </div>

                  {/* Right Side */}
                  {/* <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "flex-end",
                      justifyContent: "center",
                      minWidth: "90px",
                      flexShrink: 0,
                    }}
                  >
                    <Button
                      variant="contained"
                      size="small"
                      sx={{
                    backgroundColor: "var(--logo-cyan)",
                        textTransform: "none",
                        fontSize: "12px",
                        borderRadius: "20px",
                        px: 2,
                        py: 0.6,
                        "&:hover": {
                    backgroundColor: "var(--logo-cyan)",
                        },
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleViewDetails(ticket);
                      }}
                      startIcon={<BuildIcon />}
                    >
                      View
                    </Button>
                  </div> */}
                </Grid>
              </Grid>
            </Grid>
          ))
        ) : (
          <Typography align="center" sx={{ mt: 2 }}>
            No maintenance tickets found
          </Typography>
        )}
      </Grid>
    </div>
  );
}

export default MaintenanceCard;
