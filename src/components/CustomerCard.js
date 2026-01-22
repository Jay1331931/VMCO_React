import React from "react";
import { Grid, Typography, Button, Tooltip } from "@mui/material";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import BusinessIcon from "@mui/icons-material/Business";
import SyncIcon from "@mui/icons-material/Sync";
import { useTranslation } from "react-i18next";
function CustomerCard({ customers, isApprovalMode, handleViewDetails, handleSync }) {
  const { t, i18n } = useTranslation();
  // Status colors (matching your OrderCard style)
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
      {customers?.length > 0 ? (
        customers.map((customer) => (
          <Grid
            key={customer?.id}
            item
            xs={12}
            sm={6}
            md={4}
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "stretch",
            }}
            onClick={() => handleViewDetails(customer)}
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
                cursor: "pointer",
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
                    title={customer?.companyNameEn || "Unnamed"}
                  >
                    {i18n.language === "ar" ? customer?.companyNameAr || "Unnamed" : customer?.companyNameEn || "Unnamed"}
                  </Typography>
                  <Typography
                    fontSize={12}
                    color="white"
                    sx={{ opacity: 0.9 }}
                  >
                    {customer?.erpCustId || "ERP ID — N/A"}
                  </Typography>
                </div>

                <div
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
                      backgroundColor: getStatusColor(customer?.customerStatus),
                      color: getStatusTextColor(customer?.customerStatus),
                      borderRadius: "30px",
                      px: 1.5,
                      py: 0.3,
                      fontSize: 10,
                      fontWeight: 600,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {t(customer?.customerStatus) || t("Unknown")}
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
                  minHeight: 90,
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
                  {!isApprovalMode &&(<>
                  <Typography fontSize={13} fontWeight={600} color="#333">
                    {/* <BusinessIcon
                      fontSize="small"
                      sx={{ mr: 0.5, verticalAlign: "middle" }}
                    />{" "} */}
                    {t(customer?.companyType) || "—"}
                  </Typography>
                  <Typography fontSize={12} color="#666">
                    {t(customer?.typeOfBusiness) || t("Type N/A")}
                  </Typography>
                  <Typography fontSize={12} color="#666">
                    {`${t("Branches")}: ${customer?.branchCount ?? 0}`}
                  </Typography>
                  </>)}
                  {isApprovalMode && (<>
                  <Typography fontSize={12} color="#666">
                    {`${t("Workflow Name")}: ${customer?.workflowName}`}
                  </Typography>
                    <Typography fontSize={12} color="#666">
{`${t("Sales Executive")}: ${customer?.salesExecutiveName}`}
                  </Typography>
                  </>
                    )}
                  
                </div>

                {/* Right — Action */}
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "flex-end",
                    justifyContent: "center",
                    minWidth: "90px",
                  }}
                >

                  {isApprovalMode && (<>
                  <Typography fontSize={13} fontWeight={600} color="#333">
                    {/* <BusinessIcon
                      fontSize="small"
                      sx={{ mr: 0.5, verticalAlign: "middle" }}
                    />{" "} */}
                    {t(customer?.companyType) || "—"}
                  </Typography>
                  <Typography fontSize={12} color="#666">
                    {t(customer?.typeOfBusiness) || t("Type N/A")}
                  </Typography>
                  <Typography fontSize={12} color="#666">
                    {`${t("Branches")}: ${customer?.branchCount ?? 0}`}
                  </Typography>
                  </>)}
                  {customer?.erpCustId ? (
                    <Tooltip title="View Customer Details" arrow>
                      {/* <Button
                        variant="contained"
                        size="small"
                        sx={{
                          backgroundColor: "#009688",
                          textTransform: "none",
                          fontSize: "12px",
                          borderRadius: "20px",
                          px: 2,
                          py: 0.6,
                          "&:hover": { backgroundColor: "#00796B" },
                        }}
                        // onClick={() => handleViewDetails(customer)}
                      >
                        View
                      </Button> */}
                    </Tooltip>
                  ) : (
                    !customer?.erpCustId && customer?.customerStatus?.toLowerCase() === "approved" && (<Tooltip title="Sync Customer to ERP" arrow>
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
                        onClick={() => handleSync(customer)}
                      >
                        <SyncIcon fontSize="small" />
                        &nbsp; Sync
                      </Button>
                    </Tooltip>)
                  )}
                </div>
              </Grid>
            </Grid>
          </Grid>
        ))
      ) : (
        <Typography align="center" sx={{ mt: 2 }}>
          No customers found
        </Typography>
      )}
    </Grid>
  );
}

export default CustomerCard;
