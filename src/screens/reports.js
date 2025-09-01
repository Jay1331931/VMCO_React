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

  return (
    <div>
      <Sidebar title={t("Reports")}>
        <h3>{t("API logs link")}</h3>
        <a onClick={handleApiLogReportClick} style={{ cursor: "pointer", color: "blue", textDecoration: "underline" }}>{t("API Logs Report")}</a>
      </Sidebar>
    </div>
  );
}

export default Reports;
