import { Button, Grid, Typography, Tooltip } from "@mui/material";
import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutline";
import React from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import RbacManager from "../utilities/rbac";
import { useAuth } from "../context/AuthContext";
function SupportCard({
  tickets,
  setSelectedRow,
  handleView,
  handleAddComment,
}) {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const handleTicketClick = (ticket) => setSelectedRow(ticket);
  const { token, user, isAuthenticated, logout } = useAuth();
  const rbacMgr = new RbacManager(
    user?.userType === "employee"
      ? user?.roles[0] !== "admin"
        ? user?.designation
        : user?.roles[0]
      : "",
    "supList"
  );
  const isV = rbacMgr.isV.bind(rbacMgr);
  const isE = rbacMgr.isE.bind(rbacMgr);
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

  // 📅 Date formatter
  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);

    const day = String(date.getDate()).padStart(2, '0');
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const month = monthNames[date.getMonth()];
    const year = date.getFullYear();

    // Force LTR direction using Unicode character
    return `\u202A${day} ${month} ${year}\u202C`;
  };

  return (
    <div
      style={{
        fontSize: "12px",
        color: "#545454",
        height: "92%",
        position: "relative",
        padding: "10px",
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
                {/* Header */}
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
                    alignItems: "flex-start", // Changed from "center" to "flex-start"
                    minHeight: 61,
                    maxHeight: 61,
                    width: "100%",
                    boxSizing: "border-box",
                  }}
                >
                  {/* Left Side - Company Info */}
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      // justifyContent: "space-between", // Distribute space evenly
                      height: "100%", // Take full height
                      flex: 1,
                      marginRight: "8px",
                      minWidth: 0, // Important for text overflow
                      gap: "5px",
                    }}
                  >
                    <Typography
                      title={ticket?.companyNameEn || ticket?.companyNameAr}
                      fontSize={13}
                      fontWeight={600}
                      sx={{
                        lineHeight: 1.2,
                        mb: 0.5,
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {i18n.language === "ar"
                        ? ticket?.companyNameAr || "Unknown Customer"
                        : ticket?.companyNameEn || "Unknown Customer"}
                    </Typography>
                    {isV("daysOpen") && (<Typography
                      fontSize={11}
                      // fontWeight={500}
                      color="white"
                    // sx={{
                    //   lineHeight: 1.2,
                    //   textAlign: "right",
                    // }}
                    >
                      <Typography component="span" fontWeight={600} fontSize={11} color="white">
                        {t("Days Open")}
                      </Typography>
                      {`: ${ticket?.daysOpen || 0}`}
                    </Typography>)}
                  </div>

                  {/* Right Side - Status & Date */}
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "flex-end",
                      // justifyContent: "space-between",
                      height: "100%", // Take full height
                      minWidth: "90px",
                      flexShrink: 0,
                      gap: "10px",
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
                        textAlign: "center",
                        width: "fit-content",
                      }}
                    >
                      {t(ticket?.status) || t("N/A")}
                    </Typography>
                    <Typography
                      fontSize={11}
                      fontWeight={500}
                      color="white"
                      sx={{
                        lineHeight: 1.2,
                        textAlign: "right",
                      }}
                    >
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
                    px: "8px",
                    py: "8px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    minHeight: 80,
                    width: "100%",
                    boxSizing: "border-box",
                    // "& ..css-6v2goq-MuiGrid-root":{
                    //   paddingLeft:"8px !important",
                    //   paddingRight:"8px !important"
                    // }
                  }}
                >
                  {/* Left Side - Ticket Info */}
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      flex: 1,
                      marginRight: "8px",
                      minWidth: 0,
                      gap: "6px"

                    }}
                  >
                    <Typography
                      fontSize={14}
                      fontWeight={500}
                      color="textSecondary"
                      sx={{ lineHeight: 1.2 }}
                    >
                      {`${t("Ticket #")} ${ticket?.ticketId}`}
                    </Typography>
                    <Typography
                      fontSize={12}
                      fontWeight={500}
                      color="textSecondary"
                      sx={{ lineHeight: 1.2 }}
                    >
                      {user.userType.toLowerCase() === "employee" && `${t("ERP ID")}:${ticket?.erpCustId || "-"}`}
                    </Typography>
                    <Typography
                      fontSize={12}
                      fontWeight={500}
                      color="textSecondary"
                      sx={{
                        lineHeight: 1.2,
                        mb: 1,
                        width: "100%",
                        display: "flex",
                        alignItems: "flex-start",
                        flex: 1,
                        wordBreak: "break-word",
                      }}
                    >

                      {t("Issue Name")}:{ticket?.grievanceName || "-"}

                    </Typography>
                  </div>

                  {/* Right Side - Additional Info */}
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      width: "50%", // Fixed width instead of minWidth
                      flexShrink: 0,
                      gap: "6px"
                    }}
                  >
                    <Typography
                      fontSize={12}
                      fontWeight={500}
                      color="textSecondary"
                      sx={{
                        lineHeight: 1.2,
                        // mb: 1,
                        width: "100%",
                        display: "flex",
                        alignItems: "flex-start",
                        flex: 1,
                        // wordBreak: "break-word",
                      }}
                    >

                      {t("assignedTo")}: {ticket?.assignedTo || "-"}

                    </Typography>
                    <Typography
                      fontSize={12}
                      fontWeight={500}
                      color="textSecondary"
                      sx={{ lineHeight: 1.2 }}
                    >
                      {`${t("Business Unit")}: ${t(ticket?.entity || "-")}`}
                    </Typography>

                    <Typography
                      fontSize={12}
                      fontWeight={500}
                      color="textSecondary"
                      sx={{
                        width: "100%",
                        display: "flex",
                        alignItems: "flex-start",
                        flex: 1,
                        lineHeight: 1.2,
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        // wordBreak: "break-word",
                      }}
                    >

                      {t("Issue Type")}:{ticket?.grievanceType || "-"}

                    </Typography>
                  </div>
                </Grid>
              </Grid>
            </Grid>
          ))
        ) : (
          <Typography align="center" sx={{ mt: 2 }}>
            No tickets found
          </Typography>
        )}
      </Grid>
    </div>
  );
}

export default SupportCard;
