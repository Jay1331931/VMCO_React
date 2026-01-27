import React, { useState, useRef } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import LoadingSpinner from "../components/LoadingSpinner";
import { useTranslation } from "react-i18next";
import Sidebar from "../components/Sidebar";
import { useAuth } from "../context/AuthContext";
import RbacManager from "../utilities/rbac";
import Constants from "../constants";
import {
  Select,
  FormControl,
  Button,
  MenuItem,
  InputLabel,
} from "@mui/material";
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;
const actionBtnStyle = {
  px: 3,
  py: 1.4,
  fontSize: "15px",
  fontWeight: 600,
  borderRadius: "10px",
  textTransform: "none",
  boxShadow: "0 6px 16px rgba(0,0,0,0.15)",
};

function BulkUploadBranchAndCustomer() {
  const [loading, setLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadType, setUploadType] = useState(null); // "customer" | "branch"
  const [popup, setPopup] = useState(false);
  const { token, user, logout } = useAuth();
  const [emailloading, setEmailLoading] = useState(false);
  const [selectedEntity, setSelectedEntity] = useState("");
    const [cutOffLoading, setcutOffLoading] = useState(false);
    const [hideMenu, setHideMenu] = useState(false);
  const fileExcelInputRef = useRef();
  const { t } = useTranslation();
  const rbacMgr = new RbacManager(
    user?.userType === "employee" && user?.roles[0] !== "admin"
      ? user?.designation
      : user?.roles[0],
    "BulkUpload"
  );
  const isV = rbacMgr.isV.bind(rbacMgr);
  const isE = rbacMgr.isE.bind(rbacMgr);

  const handleTemplateDownload = async () => {
    const fileConfig = {
      customer: Constants.DOCUMENTS_NAME.CUSTOMERS_BULK_UPLOAD_FORMAT,
      branch: Constants.DOCUMENTS_NAME.BRANCH_BULK_UPLOAD_FORMAT,
      product: Constants.DOCUMENTS_NAME.PRODUCTS_UPLOAD_FORMAT,
    };
    const result = await Swal.fire({
      title: t("Confirm Download?"),
      text: t("Are you sure you want to download the template?"),
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: t("Yes, download"),
      cancelButtonText: t("No, cancel"),
    });

    if (result.isConfirmed) {
      try {
        const response = await fetch(`${API_BASE_URL}/get-files`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            fileName: fileConfig[uploadType],
            containerType: "documents",
          }),
        });

        const res = await response.json();
        if (res.status === "Ok") {
          window.open(res.data.url, "_blank", "noopener,noreferrer");
        } else {
          await Swal.fire({
            title: t("Error"),
            text: res.message || t("Failed to download template."),
            icon: "error",
            confirmButtonText: t("OK"),
            confirmButtonColor: "#dc3545",
          });
        }
      } catch (error) {
        console.error("Error downloading template:", error);
        await Swal.fire({
          title: t("Error"),
          text: t("Failed to download template."),
          icon: "error",
          confirmButtonText: t("OK"),
          confirmButtonColor: "#dc3545",
        });
      }
    }
  };

  const handleSubmitFile = async (file) => {
    if (!file || !uploadType) return;

    try {
      setLoading(true);

      const formData = new FormData();
      formData.append("file", file);

      const apiUrl =
        (uploadType === "customer" &&
          `${API_BASE_URL}/auth/bulk-excel-upload`) ||
        (uploadType === "branch" &&
          `${API_BASE_URL}/auth/bulk_upload_branch`) ||
        (uploadType === "product" &&
          `${API_BASE_URL}/auth/bulk_upload_product`);

      const response = await axios.post(apiUrl, formData, {
        headers: { "Content-Type": "multipart/form-data" },
        responseType: "blob",
        validateStatus: () => true,
      });

      if (
        response?.status === 400 &&
        response.headers["content-type"] !== "application/json"
      ) {
        const blob = new Blob([response.data], {
          type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        });

        Swal.fire({
          title: t("Validation Failed"),
          html: `
            ${t("Some rows contain validation errors.")}<br>
            ${t(
              "The Excel file has been updated with a new column named"
            )} <b>${t("Errors")}</b>.<br>
            ${t("Please open the file, review the")} <b>${t("Errors")}</b> ${t(
            "column, fix the issues, and re-upload the file."
          )}.
          `,
          icon: "warning",
          confirmButtonText: t("Download Error File"),
        }).then(() => {
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download =
            (uploadType === "customer" && "customer_upload_errors.xlsx") ||
            (uploadType === "branch" && "branch_upload_errors.xlsx") ||
            (uploadType === "product" && "product_upload_errors.xlsx");
          document.body.appendChild(a);
          a.click();
          a.remove();
          window.URL.revokeObjectURL(url);
        });

        return;
      }

      const blob = response?.data;
      const text = await blob.text();
      const data = JSON.parse(text);
      console.log("????", response);
      console.log("^^^^", data);
      if (response?.status === 200 && data?.success) {
        setPopup(false);
        Swal.fire({
          title: t("File Uploaded Successfully"),
          text:
            t(data.message) || t("Data has been updated from the Excel file."),
          icon: "success",
          confirmButtonText: t("OK"),
        });
      } else {
        Swal.fire({
          title: t("File Upload Failed"),
          text:
            t(data.message) || t("An error occurred while uploading the file."),
          icon: "error",
          confirmButtonText: t("OK"),
        });
      }
    } catch (error) {
      console.error("Error uploading file:", error);
      Swal.fire({
        title: t("File Upload Failed"),
        text: t("An error occurred while uploading the file."),
        icon: "error",
        confirmButtonText: t("OK"),
      });
    } finally {
      setLoading(false);
      setSelectedFile(null);
      setUploadType(null);
      setPopup(false);
    }
  };

  const onClose = () => {
    setPopup(false);
    setSelectedFile(null);
    if (fileExcelInputRef.current) {
      fileExcelInputRef.current.value = "";
    }
  };
  const handleSend = async () => {
    setEmailLoading(true);
    try {
      const { data } = await axios.get(
        `${API_BASE_URL}/auth/getallPrimaryCustomers`
      );

      if (data.success) {
        Swal.fire({
          title: t("BulK Email Sent Successfully"),
          text: t(data.message) || t("email sent to Customer"),
          icon: "success",
          confirmButtonText: t("OK"),
        });
      } else {
        Swal.fire({
          title: "Failed to Send email",
          text: t(data.message) || "An error occurred while sending email.",
          icon: "error",
          confirmButtonText: t("OK"),
        });
      }
    } catch (error) {
      console.error("Error fetching primary customers:", error);

      Swal.fire({
        title: "Failed to Send email",
        text:
          error.response?.data?.message ||
          "An error occurred while sending email.",
        icon: "error",
        confirmButtonText: "OK",
      });
    } finally {
      setEmailLoading(false);
    }
  };
  const handleCuttOffSubmit = async (entity) => {
    setcutOffLoading(true);
    try {
      const { data } = await axios.post(
        `${API_BASE_URL}/auth/run/runBatchCutOffEntityWise?entity=${entity}`
      );

      if (data.status?.toLowerCase() === "ok" && (data?.failedOrders==0 )) {
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
      setSelectedEntity("")
    }
  };
  return (
    <Sidebar
hideMobileBottomMenu={hideMenu} title={t("General")}>
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          padding: "30px 16px",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: "1100px",
            background: "#fff",
            borderRadius: "16px",
            padding: "28px",
            boxShadow: "0 12px 30px rgba(0,0,0,0.12)",
          }}
        >
          {/* Title */}
          <h2
            style={{
              textAlign: "center",
              marginBottom: "28px",
              color: "#0B4C45",
              fontWeight: 700,
            }}
          >
            📦 Bulk Upload Management
          </h2>

          {/* Upload Buttons */}
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              flexWrap: "wrap",
              gap: "16px",
              marginBottom: "32px",
            }}
          >
            {isV("BulkCustomer") && (
              <Button
                variant="contained"
                sx={{
                  ...actionBtnStyle,
                  backgroundColor: "#32A19F",
                  "&:hover": { backgroundColor: "#278D8A" },
                }}
                onClick={() => {
                  setUploadType("customer");
                  setPopup(true);
                }}
              >
                📤 Upload Customers
              </Button>
            )}

            {isV("BulkBranch") && (
              <Button
                variant="contained"
                sx={{
                  ...actionBtnStyle,
                  backgroundColor: "#009345",
                  "&:hover": { backgroundColor: "#007C39" },
                }}
                onClick={() => {
                  setUploadType("branch");
                  setPopup(true);
                }}
              >
                🏢 Upload Branches
              </Button>
            )}

            {isV("BulkProduct") && (
              <Button
                variant="contained"
                sx={{
                  ...actionBtnStyle,
                  backgroundColor: "#F6921E",
                  "&:hover": { backgroundColor: "#DD7F0F" },
                }}
                onClick={() => {
                  setUploadType("product");
                  setPopup(true);
                }}
              >
                📦 Upload Products
              </Button>
            )}
          </div>

 {isV("EntityWiseCutOff") && (
          <><hr style={{ border: "none", borderTop: "1px solid #eee" }} />

           <h2
            style={{
              textAlign: "center",
              // marginBottom: "28px",
              color: "#0B4C45",
              fontWeight: 700,
            }}
          >
           {t("Entity Wise Cut-off")}
          </h2>
          <div
            style={{
              // marginTop: "28px",
              display: "flex",
              justifyContent: "center",
            }}
          >
            
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "16px",
                background: "#F9FAFA",
                padding: "18px 20px",
                borderRadius: "14px",
                boxShadow: "0 6px 20px rgba(0,0,0,0.08)",
                width: "100%",
                maxWidth: "700px",
              }}
            >
                 
              <FormControl fullWidth>
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
                sx={{
                  px: 4,
                  py: 1.4,
                  fontWeight: 700,
                  borderRadius: "10px",
                  backgroundColor: "#0B4C45",
                  whiteSpace: "nowrap",
                  "&:hover": { backgroundColor: "#083A35" },
                }}
                variant="contained"
                disabled={!selectedEntity || cutOffLoading}
                onClick={() => handleCuttOffSubmit(selectedEntity)}
              >
                {cutOffLoading ? "Running..." : "Run Cut-off"}
              </Button>
            </div>
          </div></>)}
        </div>
      </div>

      {popup && (
        <div>
          <div className="gp-backdrop" onClick={onClose} />
          <div className="gp-modal">
            <div className="gp-header">
              <span className="gp-title">
                {uploadType === "customer" && t("Upload Customer Data")}
                {uploadType === "branch" && t("Upload Branch Data")}
                {uploadType === "product" && t("Upload Products Data")}
              </span>
              <button className="gp-close-btn" onClick={onClose}>
                {t("Close")}
              </button>
            </div>

            {loading ? (
              <div style={{ padding: 24 }}>
                <LoadingSpinner />
              </div>
            ) : (
              <div style={{ padding: "0 28px 20px 28px" }}>
                <p style={{ marginBottom: 20 }}>
                  {uploadType === "customer" &&
                    t("Please upload a valid Customer Excel file.")}
                  {uploadType === "branch" &&
                    t("Please upload a valid Branch Excel file.")}
                  {uploadType === "product" &&
                    t("Please upload a valid Product Excel file.")}
                </p>
                <div className="popup-buttons-row">
                  <button
                    className="download-btn"
                    onClick={() => handleTemplateDownload()}
                  >
                    📥 {t("Download Excel Template")}
                  </button>
                  <button
                    className="upload-btn"
                    onClick={() => fileExcelInputRef.current.click()}
                  >
                    📤 {t("Upload Completed Excel File")}
                  </button>
                  <input
                    type="file"
                    ref={fileExcelInputRef}
                    accept=".xlsx, .xls"
                    style={{ display: "none" }}
                    // onChange={handleFileChange}
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) setSelectedFile(file); // just store file in state
                    }}
                  />
                </div>
                {/* <input
                  type="file"
                  ref={fileExcelInputRef}
                  accept=".xlsx, .xls"
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) setSelectedFile(file);
                  }}
                /> */}

                {selectedFile && (
                  <div
                    style={{
                      marginTop: 16,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <p style={{ margin: 0 }}>
                      {t("Selected File")}: <b>{selectedFile.name}</b>
                    </p>
                    <button
                      className="submit-btn"
                      onClick={() => handleSubmitFile(selectedFile)}
                    >
                      ✅ {t("Submit File")}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
          <style>
            {`
            :root {
              --navy-blue: #00205B;
              --light-blue: #008CDE;
              --deep-green: #00594C;
              --orange: #EF7C00;
              --steel-grey: #5E6A71;
              --cool-grey: #D9D9D6;
              --light-grey-tint: #F4F5F6;
              --success: #4CAF50;
              --error: #E65100;
            }





     

          


          

          

            .submit-btn {
              background: var(--navy-blue);
              color: #fff;
              border: none;
              padding: 10px 18px;
              border-radius: 6px;
              cursor: pointer;
              transition: background 0.3s ease;
            }

            .submit-btn:hover {
              background: var(--navy-blue);
            }

            .gp-backdrop {
              position: fixed;
              top: 0; left: 0; right: 0; bottom: 0;
              background: rgba(0,0,0,0.15);
              z-index: 1000;
            }

            .gp-modal {
              position: fixed;
              top: 50%; 
              left: 50%;
              transform: translate(-50%, -50%);
              background: #fff;
              border-radius: 12px;
              box-shadow: 0 8px 32px rgba(0,0,0,0.18);
              width: 700px;
              max-width: 95vw;
              z-index: 1001;
              animation: gp-fadein 0.2s;
            }

            @keyframes gp-fadein {
              from { opacity: 0; transform: translate(-50%, -60%);}
              to { opacity: 1; transform: translate(-50%, -50%);}
            }

            .gp-header {
              display: flex;
              justify-content: space-between;
              align-items: center;
              padding: 22px 28px 10px 28px;
            }

            .gp-title {
              font-size: 1.25rem;
              font-weight: 500;
            }

            .gp-close-btn {
              padding: 7px 18px;
              border-radius: 6px;
              border: 1px solid var(--cool-grey);
              background: #fff;
              color: var(--steel-grey);
              font-size: 1rem;
              cursor: pointer;
              transition: background 0.15s;
            }

            .gp-close-btn:hover {
              background: var(--light-grey-tint);
            }
          `}
          </style>
        </div>
      )}
    </Sidebar>
  );
}

export default BulkUploadBranchAndCustomer;
