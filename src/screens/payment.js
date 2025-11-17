// pages/PaymentPage.js
import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import "../i18n";
import { useTranslation } from "react-i18next";
import Swal from "sweetalert2";
import { useAuth } from "../context/AuthContext";
import {
  Box,
  Button,
  Card,
  Typography,
  CircularProgress,
  Grow,
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorIcon from "@mui/icons-material/Error";
import HourglassTopIcon from "@mui/icons-material/HourglassTop";
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

const PaymentPage = () => {
  const { i18n } = useTranslation();
  const { t } = useTranslation();
  const { token } = useAuth();

  const location = useLocation();
  const query = new URLSearchParams(location.search);
  const orderId = query.get("orderId");
  const amount = query.get("amount");
  const customerName = query.get("customerName") || null;
  const linkExpiryDays = query.get("linkExpiryDays") || 1;
  const status = query.get("status");
  const message = query.get("message");
  const paymentId = query.get("paymentId");

  const [isLoading, setIsLoading] = useState(false);
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  const handleCancel = () => {
    // window.close();
  

    if (isMobile) {
      window.close();
    } else {
      const URL = `${window.location.protocol}//${window.location.host}/orders`;

      window.location.replace(URL);
    }
  };

  const handleContinue = async () => {
    setIsLoading(true);
    try {
      const { data } = await axios.post(
        `${API_BASE_URL}/payment/generate-link`,
        {
          salesOrderId: orderId,
          amount: amount,
          customerName: customerName,
          linkExpiryDays: linkExpiryDays,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      console.log("Payment response:", data);
      if (!data || data.status !== "Success") {
        Swal.fire({
          icon: "error",
          title: t("Payment failed"),
          text: t(
            data?.message || "An error occurred while processing your payment."
          ),
          confirmButtonText: t("OK"),
        });
        setIsLoading(false);
        return;
      } else if (data?.data?.url) {
        window.location.href = data.data.url;
      } else {
        Swal.fire({
          icon: "error",
          title: t("Payment failed"),
          text: t("No payment link received from the server."),
          confirmButtonText: t("OK"),
        });
        setIsLoading(false);
      }
    } catch (error) {
      console.log("Payment error:", error);
      Swal.fire({
        icon: "error",
        title: t("Payment error"),
        text: t("An error occurred while initiating the payment."),
        confirmButtonText: t("OK"),
      });
      setIsLoading(false);
    }
  };

  return (
    <Box
      sx={{
        maxWidth: 480,
        mx: "auto",
        my: 5,
        p: 3,
        // borderRadius: 4,
        // boxShadow: 4,
        bgcolor: "background.paper",
        textAlign: "center",
        fontFamily: "Inter, sans-serif",
      }}
    >
      {!status && (
        <>
          <Typography variant="h5" fontWeight={600} mb={2}>
            Confirm Your Payment
          </Typography>

          <Card
            variant="outlined"
            sx={{
              textAlign: "left",
              p: 2,
              borderRadius: 3,
              background: "linear-gradient(135deg, #f8fafc, #eef2f7)",
              mb: 3,
            }}
          >
            <Typography variant="body1">
              <strong>Order ID:</strong> {orderId}
            </Typography>
            <Typography variant="body1">
              <strong>Amount:</strong> {amount} SAR
            </Typography>
            <Typography variant="body1">
              <strong>Customer Name:</strong> {customerName || "N/A"}
            </Typography>
          </Card>

          <Box sx={{ display: "flex", gap: 2 }}>
            <Button
              onClick={handleCancel}
              variant="contained"
              color="error"
              fullWidth
              disabled={isLoading}
              sx={{ py: 1.2, borderRadius: 2 }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleContinue}
              variant="contained"
              color="success"
              fullWidth
              disabled={isLoading}
              sx={{ py: 1.2, borderRadius: 2 }}
            >
              {isLoading ? "Processing..." : "Continue to Payment"}
            </Button>
          </Box>
        </>
      )}

      {status && (
        <Grow in={true} timeout={500}>
          <Card
            sx={{
              p: 4,
              borderRadius: 4,
              mt: 2,
              ...(status === "success" && {
                background: "linear-gradient(135deg, #e0fce7, #bbf7d0)",
                color: "#166534",
              }),
              ...(status === "failed" && {
                background: "linear-gradient(135deg, #fdeaea, #fddcdc)",
                color: "#991b1b",
              }),
              ...(status === "pending" && {
                background: "linear-gradient(135deg, #fff7e6, #fff2cc)",
                color: "#92400e",
              }),
              boxShadow: 6,
              textAlign: "center",
            }}
          >
            <Box sx={{ mb: 2 }}>
              {status === "success" && (
                <CheckCircleIcon sx={{ fontSize: 70, color: "#16a34a" }} />
              )}
              {status === "failed" && (
                <ErrorIcon sx={{ fontSize: 70, color: "#dc2626" }} />
              )}
              {status === "pending" && (
                <CircularProgress
                  size={70}
                  thickness={5}
                  sx={{ color: "#f59e0b" }}
                />
              )}
            </Box>

            <Typography variant="h5" fontWeight={700} mb={1}>
              {status === "success"
                ? "Payment Successful"
                : status === "failed"
                ? "Payment Failed"
                : "Processing Payment..."}
            </Typography>

            {message && (
              <Typography variant="body1" mb={1}>
                {message}
              </Typography>
            )}
            {paymentId && status === "success" && (
              <Typography
                variant="body1"
                sx={{
                  mt: 1,
                  wordBreak: "break-all", // ensures long IDs wrap
                  fontWeight: 500,
                  color: "rgba(0,0,0,0.7)",
                  textAlign: "center",
                }}
              >
                Payment ID: {paymentId}
              </Typography>
            )}
 {isMobile&&(<Typography
                variant="body1"
                sx={{
                  mt: 1,
                  wordBreak: "break-all", // ensures long IDs wrap
                  fontWeight: 500,
                  color: "rgba(0,0,0,0.7)",
                  textAlign: "center",
                }}
              >
             
            Please close this page and open your application to continue.
   
              </Typography>)}
            <Button
              variant="contained"
              onClick={handleCancel}
              sx={{
                mt: 3,
                px: 4,
                py: 1,
                borderRadius: 3,
                backgroundColor:
                  status === "success"
                    ? "#16a34a"
                    : status === "failed"
                    ? "#dc2626"
                    : "#3b82f6",
                "&:hover": {
                  backgroundColor:
                    status === "success"
                      ? "#15803d"
                      : status === "failed"
                      ? "#b91c1c"
                      : "#2563eb",
                },
              }}
            >
              {status === "success" ? "Done" : "Close"}
            </Button>
          </Card>
        </Grow>
      )}
    </Box>
  );
};

export default PaymentPage;
