import React from "react";
import Sidebar from "../components/Sidebar";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import RbacManager from "../utilities/rbac";
import {
  Grid,
  Paper,
} from "@mui/material";
import {
  FontAwesomeIcon,
} from "@fortawesome/react-fontawesome";
import {
  faServer,
  faCheckCircle,
  faCreditCard,
} from "@fortawesome/free-solid-svg-icons";

const reportCardStyle = {
  padding: "24px",
  borderRadius: "12px",
  background: "linear-gradient(135deg, #f5f5f5 0%, #ffffff 100%)",
  cursor: "pointer",
  transition: "all 0.2s ease",
  border: "1px solid #e0e0e0",
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-start",
  justifyContent: "space-between",
  height: "100%",
  width: "250px",
  "&:hover": {
    transform: "translateY(-2px)",
  },
};

const iconStyle = {
  fontSize: "32px",
  marginBottom: "12px",
  display: "block",
};

function Reports() {
  const { t } = useTranslation();
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();
  const rbacMgr = new RbacManager(
    user?.userType === "employee" && user?.roles[0] !== "admin"
      ? user?.designation
      : user?.roles[0],
    "Reports"
  );
  const isV = rbacMgr.isV.bind(rbacMgr);
  const isE = rbacMgr.isE.bind(rbacMgr);
  const handleApiLogReportClick = () => {
    navigate("/apiLogsReport");
  };

  const handleApprovalHistoryClick = () => {
    navigate("/approvalHistory");
  };

  const handleOrderStagingTableClick = () => {
    navigate("/orderStagingTable");
  };

  return (
    <Sidebar title={t("Reports")}>
      <div
        style={{
          display: "flex",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: "1200px",
            background: "#fff",
            borderRadius: "16px",
          }}
        >
          {/* Reports Section */}
          <div style={{ marginBottom: "50px" }}>
            <h2
              style={{
                color: "var(--logo-deep-green)",
                fontWeight: 600,
                fontSize: "20px",
                marginBottom: "24px",
                paddingBottom: "12px",
                borderBottom: "2px solid var(--logo-deep-green)",
              }}
            >
              Available Reports
            </h2>

            <Grid container spacing={3} sx={{ justifyContent: "center" }}>
              {isV("APILogsReport") && (
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <Paper
                    sx={reportCardStyle}
                    onClick={handleApiLogReportClick}
                  >
                    <FontAwesomeIcon
                      icon={faServer}
                      style={{
                        ...iconStyle,
                        color: "var(--logo-cyan)",
                      }}
                    />
                    <h3
                      style={{
                        margin: "0 0 8px 0",
                        color: "#333",
                        fontSize: "16px",
                        fontWeight: 600,
                      }}
                    >
                      {t("API Logs Report")}
                    </h3>
                    <p
                      style={{
                        color: "#666",
                        fontSize: "13px",
                      }}
                    >
                      View API logs and activities
                    </p>
                  </Paper>
                </Grid>
              )}

              {isV("ApprovalHistory") && (
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <Paper
                    sx={reportCardStyle}
                    onClick={handleApprovalHistoryClick}
                  >
                    <FontAwesomeIcon
                      icon={faCheckCircle}
                      style={{
                        ...iconStyle,
                        color: "var(--logo-light-green)",
                      }}
                    />
                    <h3
                      style={{
                        margin: "0 0 8px 0",
                        color: "#333",
                        fontSize: "16px",
                        fontWeight: 600,
                      }}
                    >
                      {t("Approval History")}
                    </h3>
                    <p
                      style={{
                        color: "#666",
                        fontSize: "13px",
                      }}
                    >
                      Track approval workflows and status
                    </p>
                  </Paper>
                </Grid>
              )}

              {isV("CardTransactionTempIdReport") && (
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <Paper
                    sx={reportCardStyle}
                    onClick={handleOrderStagingTableClick}
                  >
                    <FontAwesomeIcon
                      icon={faCreditCard}
                      style={{
                        ...iconStyle,
                        color: "var(--logo-orange)",
                      }}
                    />
                    <h3
                      style={{
                        margin: "0 0 8px 0",
                        color: "#333",
                        fontSize: "16px",
                        fontWeight: 600,
                      }}
                    >
                      {t("Card Transactions")}
                    </h3>
                    <p
                      style={{
                        color: "#666",
                        fontSize: "13px",
                      }}
                    >
                      View card transaction details
                    </p>
                  </Paper>
                </Grid>
              )}
            </Grid>
          </div>
        </div>
      </div>
    </Sidebar>
  );
}

export default Reports;
