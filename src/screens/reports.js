import React from "react";
import Sidebar from "../components/Sidebar";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
function Reports() {
  const { t } = useTranslation();
  const navigate = useNavigate();

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

  return (
    <div>
      <Sidebar title={t("Reports")}>
        <div style={{ marginBottom: "40px" }}><h3>{t("API logs link")}</h3>
        <a onClick={handleApiLogReportClick} style={{ cursor: "pointer", color: "blue", textDecoration: "underline", marginBottom: "12px" }}>{t("API Logs Report")}</a>
        </div>
        <break />
        <break />
        <div style={{ marginBottom: "40px" }}><h3> {t("Delivery Schedule")}</h3>
        <a onClick={handleDeliveryScheduleClick} style={{ cursor: "pointer", color: "blue", textDecoration: "underline", marginBottom: "12px" }}>{t("Delivery Schedule")}</a>
        </div>
        <break />
        <break />
        <div style={{ marginBottom: "40px" }}><h3> {t("Price lists")}</h3>
        <a onClick={handlePriceListReportClick} style={{ cursor: "pointer", color: "blue", textDecoration: "underline", marginBottom: "12px" }}>{t("Price List Report")}</a>
        </div>
        <break />
        <break />
      </Sidebar>
    </div>
  );
}

export default Reports;
