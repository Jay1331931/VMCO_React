import React from "react";
import Sidebar from "../components/Sidebar";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import RbacManager from "../utilities/rbac";
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
    // Navigate to the API logs report page
    navigate("/apiLogsReport");
  };

  const handleDeliveryScheduleClick = () => {
    // Navigate to the Delivery Schedule page
    navigate("/deliveryScheduleEditor");
  }

  const handlePriceListReportClick = () => {
    // Navigate to the Price List report page
    navigate("/priceListEditor");
  }

  const handleOrderStagingTableClick = () => {
    // Navigate to the Order Staging Table page
    navigate("/orderStagingTable");
  }

  const handleCoolingPeriodClick = () => {
    // Navigate to the Delivery Schedule page
    navigate("/coolingPeriodEditor");
  }
  const handlePricingPolicyClick = () => {
    // Navigate to the Pricing Policy Editor page
    navigate("/pricingPolicyEditor");
  }

  return (
    <div>
      <Sidebar title={t("Reports")}>
        {isV("APILogsReport") && (<div style={{ marginBottom: "40px" }}><h3>{t("API logs link")}</h3>
        <a onClick={handleApiLogReportClick} style={{ cursor: "pointer", color: "blue", textDecoration: "underline", marginBottom: "12px" }}>{t("API Logs Report")}</a>
        </div>)}
        <break />
        <break />
        {isV("DeliveryScheduleReport") && (<div style={{ marginBottom: "40px" }}><h3> {t("Delivery Schedule")}</h3>
        <a onClick={handleDeliveryScheduleClick} style={{ cursor: "pointer", color: "blue", textDecoration: "underline", marginBottom: "12px" }}>{t("Delivery Schedule")}</a>
        </div>)}
        <break />
        <break />
        {isV("PriceListsReport") && (<div style={{ marginBottom: "40px" }}><h3> {t("Price lists")}</h3>
        <a onClick={handlePriceListReportClick} style={{ cursor: "pointer", color: "blue", textDecoration: "underline", marginBottom: "12px" }}>{t("Price List Report")}</a>
        </div>)}
        <break />
        <break />
        {isV("CardTransactionTempIdReport") && (<div style={{ marginBottom: "40px" }}><h3> {t("Card Transaction Temp ID")}</h3>
        <a onClick={handleOrderStagingTableClick} style={{ cursor: "pointer", color: "blue", textDecoration: "underline", marginBottom: "12px" }}>{t("Card Transaction Temp ID Report")}</a>
        </div>)}
        <break />
        <break />
        {isV("CoolingPeriodReport") && (<div style={{ marginBottom: "40px" }}><h3> {t("Cooling Period Table")}</h3>
        <a onClick={handleCoolingPeriodClick} style={{ cursor: "pointer", color: "blue", textDecoration: "underline", marginBottom: "12px" }}>{t("Order Staging Report")}</a>
        </div>)}
        <break />
        {isV("PricingPolicyReport") && (<div style={{ marginBottom: "40px" }}><h3> {t("Pricing Policy Table")}</h3>
        <a onClick={handlePricingPolicyClick} style={{ cursor: "pointer", color: "blue", textDecoration: "underline", marginBottom: "12px" }}>{t("Pricing Policy Report")}</a>
        </div>)}
      </Sidebar>
    </div>
  );
}

export default Reports;
