import React, { useState } from "react";

const PdfPopupViewer = ({ pdfFiles, showModal, onClose ,t}) => {
  if (!showModal) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0, left: 0, width: "100vw", height: "100vh",
        backgroundColor: "rgba(0,0,0,0.6)",
        display: "flex", justifyContent: "center", alignItems: "center",
        zIndex: 1000,
      }}
    >
      <div
        style={{
          backgroundColor: "#fff",
          padding: "20px",
          borderRadius: "8px",
          maxWidth: "600px",
          width: "90%",
        }}
      >
        <h3>{t("Sale Order Invoices")}</h3>
        <ul style={{ listStyle: "none", padding: 0 }}>
          {pdfFiles.map((file, idx) => (
            <li
              key={idx}
              style={{
                marginBottom: "15px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                borderBottom: "1px solid #ddd",
                paddingBottom: "8px",
              }}
            >
              <span>{file.fileName}</span>
              <a
                href={file.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  padding: "6px 12px",
                  backgroundColor: "#00205b",
                  color: "#fff",
                  borderRadius: "4px",
                  textDecoration: "none",
                }}
              >
                {t("Download")}
              </a>
            </li>
          ))}
        </ul>

        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "10px" }}>
  <button
    onClick={onClose}
    style={{
      padding: "6px 12px",
      backgroundColor: "#dc3545",
      color: "#fff",
      border: "none",
      borderRadius: "4px",
    }}
  >
    {t("Close")}
  </button>
</div>

      </div>
    </div>
  );
};

export default PdfPopupViewer;
