import React, { useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import Sidebar from "../components/Sidebar";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import RbacManager from "../utilities/rbac";
import {
    Select,
    FormControl,
    Button,
    MenuItem,
    InputLabel,
    Grid,
    Paper,
} from "@mui/material";
import {
    FontAwesomeIcon,
} from "@fortawesome/react-fontawesome";
import {
    faCalendarAlt,
    faList,
    faSnowflake,
    faPercentage,
    faCut,
} from "@fortawesome/free-solid-svg-icons";

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

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

const buttonStyle = {
    px: 3,
    py: 1.5,
    fontSize: "14px",
    fontWeight: 600,
    borderRadius: "8px",
    textTransform: "none",
    "&:hover": {
        filter: "brightness(0.95)",
    },
};

function DataManagement() {
    const { t } = useTranslation();
    const { user, token, logout } = useAuth();
    const navigate = useNavigate();
    const [selectedEntity, setSelectedEntity] = useState("");
    const [cutOffLoading, setcutOffLoading] = useState(false);

    const rbacMgr = new RbacManager(
        user?.userType === "employee" && user?.roles[0] !== "admin"
            ? user?.designation
            : user?.roles[0],
        "DataManagement"
    );

    const isV = rbacMgr.isV.bind(rbacMgr);
    const isE = rbacMgr.isE.bind(rbacMgr);

    const handleDeliveryScheduleClick = () => {
        navigate("/deliveryScheduleEditor");
    };

    const handlePriceListReportClick = () => {
        navigate("/priceListEditor");
    };

    const handleCoolingPeriodClick = () => {
        navigate("/coolingPeriodEditor");
    };

    const handlePricingPolicyClick = () => {
        navigate("/pricingPolicyEditor");
    };

    const handleCuttOffSubmit = async (entity) => {
        setcutOffLoading(true);
        try {
            const { data } = await axios.post(
                `${API_BASE_URL}/auth/run/runBatchCutOffEntityWise?entity=${entity}`
            );

            if (data.status?.toLowerCase() === "ok" && (data?.failedOrders == 0)) {
                Swal.fire({
                    title: t("Cut-off Run Successfully"),
                    text: t(data.message) || t("Cut-off Run Successfully"),
                    icon: "success",
                    confirmButtonText: t("OK"),
                });
            } else {
                const failedMessage = Object.entries(
                    (data?.failedOrders || [])
                        .filter((r) => r.status !== "success")
                        .reduce((acc, result) => {
                            const error = result?.error || "Unknown error";
                            acc[error] = (acc[error] || 0) + 1;
                            return acc;
                        }, {})
                )
                    .map(([error, count]) => `• ${error}: ${count} order(s)`)
                    .join("\n");
                Swal.fire({
                    title: "Cut-off Failed",
                    text:
                        t(failedMessage) ||
                        "Some orders failed during the cut-off process.",
                    icon: "error",
                    confirmButtonText: t("OK"),
                });
            }
        } catch (error) {
            console.error("An error occurred while running Cut-off:", error);

            Swal.fire({
                title: "Cut-off Failed",
                text:
                    error.response?.data?.message ||
                    "An error occurred while running Cut-off:",
                icon: "error",
                confirmButtonText: "OK",
            });
        } finally {
            setcutOffLoading(false);
            setSelectedEntity("");
        }
    };

    return (
        <Sidebar title={t("General")}>
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
                    {isV("dataManagementSection") && (<div style={{ marginBottom: "50px" }}>
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
                            Reports & Schedules
                        </h2>

                        <Grid container spacing={3} sx={{ justifyContent: "center" }}>
                            {isV("DeliveryScheduleEditor") && (
                                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                                    <Paper
                                        sx={reportCardStyle}
                                        onClick={handleDeliveryScheduleClick}
                                    >
                                        <FontAwesomeIcon
                                            icon={faCalendarAlt}
                                            style={{
                                                ...iconStyle,
                                                color: "var(--logo-red)",
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
                                            {t("Delivery Schedule")}
                                        </h3>
                                        <p
                                            style={{
                                                color: "#666",
                                                fontSize: "13px",
                                            }}
                                        >
                                            Manage delivery schedules and timelines
                                        </p>
                                    </Paper>
                                </Grid>
                            )}

                            {isV("PriceListsEditor") && (
                                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                                    <Paper
                                        sx={reportCardStyle}
                                        onClick={handlePriceListReportClick}
                                    >
                                        <FontAwesomeIcon
                                            icon={faList}
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
                                            {t("Price Lists")}
                                        </h3>
                                        <p
                                            style={{
                                                color: "#666",
                                                fontSize: "13px",
                                            }}
                                        >
                                            View and manage price lists
                                        </p>
                                    </Paper>
                                </Grid>
                            )}

                            {isV("CoolingPeriodEditor") && (
                                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                                    <Paper
                                        sx={reportCardStyle}
                                        onClick={handleCoolingPeriodClick}
                                    >
                                        <FontAwesomeIcon
                                            icon={faSnowflake}
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
                                            {t("Cooling Period")}
                                        </h3>
                                        <p
                                            style={{
                                                color: "#666",
                                                fontSize: "13px",
                                            }}
                                        >
                                            Configure cooling period settings
                                        </p>
                                    </Paper>
                                </Grid>
                            )}

                            {isV("PricingPolicyEditor") && (
                                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                                    <Paper
                                        sx={reportCardStyle}
                                        onClick={handlePricingPolicyClick}
                                    >
                                        <FontAwesomeIcon
                                            icon={faPercentage}
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
                                            {t("Pricing Policy")}
                                        </h3>
                                        <p
                                            style={{
                                                color: "#666",
                                                fontSize: "13px",
                                            }}
                                        >
                                            Manage pricing policies
                                        </p>
                                    </Paper>
                                </Grid>
                            )}
                        </Grid>
                    </div>)}

                    {/* Entity Wise Cut-off Section */}
                    {isV("EntityWiseCutOffSection") && (
                        <div>
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
                                {t("Entity Wise Cut-off")}
                            </h2>

                            <Paper
                                sx={{
                                    padding: "32px",
                                    background: "linear-gradient(135deg, #f5f5f5 0%, #ffffff 100%)",
                                    borderRadius: "12px",
                                    border: "1px solid #e0e0e0",
                                }}
                            >
                                <div
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "24px",
                                        flexWrap: "wrap",
                                    }}
                                >
                                    <div style={{ flex: "1", minWidth: "250px" }}>
                                        <div
                                            style={{
                                                display: "flex",
                                                alignItems: "center",
                                                gap: "12px",
                                                marginBottom: "16px",
                                            }}
                                        >
                                            <h3
                                                style={{
                                                    margin: 0,
                                                    color: "#333",
                                                    fontSize: "16px",
                                                    fontWeight: 600,
                                                }}
                                            >
                                                {t("Entity Wise Cut-off")}
                                            </h3>
                                        </div>
                                        <p
                                            style={{
                                                margin: "0 0 16px 0",
                                                color: "#666",
                                                fontSize: "13px",
                                            }}
                                        >
                                            Run cut-off process for specific entities. Select an entity and click "Run Cut-off" to execute the operation.
                                        </p>
                                    </div>

                                    <FormControl
                                        sx={{
                                            minWidth: "200px",
                                            flexShrink: 0,
                                        }}
                                    >
                                        <InputLabel>{t("Select Entity")}</InputLabel>
                                        <Select
                                            value={selectedEntity}
                                            label="Select Entity"
                                            onChange={(e) => setSelectedEntity(e.target.value)}
                                        >
                                            <MenuItem value="SHC">SHC</MenuItem>
                                            <MenuItem value="GMTC">GMTC</MenuItem>
                                        </Select>
                                    </FormControl>

                                    <Button
                                        variant="contained"
                                        sx={{
                                            ...buttonStyle,
                                            backgroundColor: "var(--logo-deep-green)",
                                            minWidth: "160px",
                                        }}
                                        disabled={!selectedEntity || cutOffLoading}
                                        onClick={() => handleCuttOffSubmit(selectedEntity)}
                                    >
                                        {cutOffLoading ? (
                                            <span
                                                style={{
                                                    display: "flex",
                                                    alignItems: "center",
                                                    gap: "8px",
                                                }}
                                            >
                                                <span
                                                    style={{
                                                        display: "inline-block",
                                                        animation: "spin 1s linear infinite",
                                                    }}
                                                >
                                                    ⟳
                                                </span>
                                                Running...
                                            </span>
                                        ) : (
                                            "Run Cut-off"
                                        )}
                                    </Button>
                                </div>
                            </Paper>

                            <style>
                                {`
                  @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                  }
                `}
                            </style>
                        </div>
                    )}
                </div>
            </div>
        </Sidebar>
    );
}

export default DataManagement;