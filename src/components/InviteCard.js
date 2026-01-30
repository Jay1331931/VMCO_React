import React from "react";
import { Grid, Typography, Button, Tooltip } from "@mui/material";
import IosShareIcon from "@mui/icons-material/IosShare";
import { useTranslation } from "react-i18next";

function InviteCard({ invites, handleResend }) {
  const { t, i18n } = useTranslation();

  // Status colors just like CustomerCard
  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "registered":
        return "#CCF9E2";
      case "pending":
        return "#FCDF80";
      case "expired":
        return "#F2D7D7";
      default:
        return "#E5E7EB";
    }
  };

  const getStatusTextColor = (status) => {
    switch (status?.toLowerCase()) {
      case "registered":
        return "#10472A";
      case "pending":
        return "#524906";
      case "expired":
        return "#8D1A1A";
      default:
        return "#545454";
    }
  };

  return (
    <Grid
      container
      spacing={1}
      sx={{
        width: "100%",
        pt: "1vh",
        justifyContent: "center",
      }}
    >
      {invites?.length > 0 ? (
        invites.map((invite) => (
          <Grid
            key={invite?.id}
            item
            xs={12}
            sm={6}
            md={4}
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
                width: 340,
                boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
                transition: "all 0.2s ease",
                cursor: "default",
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
                  minHeight: 70,
                  width: "100%",
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
                    title={invite?.companyName}
                  >
                    {invite?.companyName || t("Unnamed")}
                  </Typography>

                  <Typography
                    fontSize={12}
                    color="white"
                    sx={{ opacity: 0.9 }}
                  >
                    {invite?.companyEmail}
                  </Typography>
                </div>

                {/* Status badge */}
                {/* <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "flex-end",
                    justifyContent: "center",
                    minWidth: "90px",
                  }}
                >
                  <Typography
                    sx={{
                      backgroundColor: getStatusColor(
                        invite?.registered ? "registered" : "pending"
                      ),
                      color: getStatusTextColor(
                        invite?.registered ? "registered" : "pending"
                      ),
                      borderRadius: "30px",
                      px: 1.5,
                      py: 0.3,
                      fontSize: 10,
                      fontWeight: 600,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {invite?.registered ? t("Registered") : t("Pending")}
                  </Typography>
                </div> */}
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
                  minHeight: 90,
                  width: "100%",
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
                  <Typography fontSize={13} fontWeight={600} color="#333">
                    {invite?.leadName}
                  </Typography>

                  <Typography fontSize={12} color="#666">
                    {t("Phone")}: {invite?.companyPhone || "-"}
                  </Typography>

                  <Typography fontSize={12} color="#666">
                    {t("Region")}: {invite?.region || "-"}
                  </Typography>
                </div>

                {/* Right side — Action */}
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "flex-end",
                    justifyContent: "center",
                    minWidth: "90px",
                  }}
                >
                  {!invite?.registered && (
                    <Tooltip title={t("Resend Invite")} arrow>
                      <Button
                        variant="contained"
                        size="small"
                        sx={{
                          backgroundColor: "#f5a623",
                          color: "white",
                          textTransform: "none",
                          fontSize: "12px",
                          borderRadius: "20px",
                          px: 2,
                          py: 0.6,
                          "&:hover": { backgroundColor: "#e28d12" },
                        }}
                        onClick={() => handleResend(invite)}
                      >
                        <IosShareIcon fontSize="small" />
                        &nbsp; {t("Resend")}
                      </Button>
                    </Tooltip>
                  )}
                </div>
              </Grid>
            </Grid>
          </Grid>
        ))
      ) : (
        <Typography align="center" sx={{ mt: 2 }}>
          {t("No invites found")}
        </Typography>
      )}
    </Grid>
  );
}

export default InviteCard;
