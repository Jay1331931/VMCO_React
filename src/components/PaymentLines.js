import React, { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Container,
  Grid,
  Tooltip,
  Typography,
} from "@mui/material";
import Swal from "sweetalert2";
import axios from "axios";
import Sidebar from "./Sidebar";
import { useTranslation } from "react-i18next";
import SyncIcon from "@mui/icons-material/Sync";
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;
const getCookie = (name) => localStorage.getItem(name);

const PaymentLines = () => {
  const { t } = useTranslation();
  const { orderId } = useParams();
  const [payment, setPayment] = useState(null);
  const [loading, setLoading] = useState(false);
  const [syncLoading, setSyncLoading] = useState(false);
  const token = getCookie("token");

  const fetchPaymentLines = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        `${API_BASE_URL}/get_payment_lines?orderId=${orderId}`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response?.data?.success && response?.data?.details) {
        setPayment(response.data.details);
      } else {
        Swal.fire({
          title: "Error",
          text: response?.data?.message ||  "Something went wrong while fetching payment lines",
          icon: "error",
          confirmButtonText: "OK",
          confirmButtonColor: "#dc3545",
        });
       
      }
    } catch (error) {
      console.error(error);
     
       Swal.fire({
          title: "Error",
          text: error?.response?.data?.message ||  "Something went wrong while fetching payment lines",
          icon: "error",
          confirmButtonText: "OK",
          confirmButtonColor: "#dc3545",
        });
    } finally {
      setLoading(false);
    }
  }, [orderId, token]);

  useEffect(() => {
    if (orderId) fetchPaymentLines();
  }, [orderId, fetchPaymentLines]);

  const handleSync = async () => {
    try {
     
      const { data } = await axios.post(
        `${API_BASE_URL}/sync_payment_lines?id=${payment.id}`,
        {},
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (data.success) {
        fetchPaymentLines();
        setSyncLoading(false);

        Swal.fire({
          title: "Success",
          text: data.message || "payment synce Successfully",
          icon: "success",
          confirmButtonText: "OK",
          confirmButtonColor: "#3085d6",
        });
      } else {
        setSyncLoading(false);
        Swal.fire({
          title: "Error",
          text: data.message || "Failed to Sync with FandO.",
          icon: "error",
          confirmButtonText: "OK",
          confirmButtonColor: "#dc3545",
        });
      }
    } catch (error) {
      Swal.fire("Error", "Sync failed. Please try again.", "error");
    }
  };

  const paymentLines = payment?.paymentlines || [];
  const isErpOrderId = paymentLines?.some((line) => !line.erpOrderId);
  const isUnsynced =  (payment?.sync === false || payment?.sync==null)  && isErpOrderId ;
  const formatToRiyadhTime = (dateString) => {
    if (!dateString) return "—";
    try {
      const date = new Date(dateString);
      return date.toLocaleString("en-SA", {
        timeZone: "Asia/Riyadh",
        year: "numeric",
        month: "short",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
      });
    } catch {
      return "Invalid date";
    }
  };

  return (
    <Sidebar title={t("Payments")}>
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Typography variant="h5" fontWeight="bold" gutterBottom>
          {t("Payment Lines for Order")} #{orderId}
        </Typography>

        {loading ? (
          <Box
            display="flex"
            justifyContent="center"
            alignItems="center"
            mt={6}
          >
            <CircularProgress />
          </Box>
        ) : (
          <>
            {payment && (
              <Card
                elevation={4}
                sx={{
                  mb: 3,
                  borderRadius: 3,
                  background: "#f9fafb",
                  p: 2,
                }}
              >
                <CardContent>
                  <Grid
                    container
                    spacing={2}
                    alignItems="center"
                    justifyContent="space-between"
                  >
                    {/* Left: Payment Details */}
                    <Grid item xs={12} md={9}>
                      <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                          <Typography
                            variant="subtitle2"
                            color="text.secondary"
                          >
                            {t("Payment Method")}
                          </Typography>
                          <Typography variant="h6" fontWeight={600}>
                            {payment?.payment_method || "—"}
                          </Typography>
                        </Grid>

                        <Grid item xs={12} sm={6}>
                          <Typography
                            variant="subtitle2"
                            color="text.secondary"
                          >
                            {t("Total Amount")}
                          </Typography>
                          <Typography variant="h6" fontWeight={600}>
                            ₹ {payment?.totalamount?.toLocaleString() || "—"}
                          </Typography>
                        </Grid>

                        <Grid item xs={12} sm={6}>
                          <Typography
                            variant="subtitle2"
                            color="text.secondary"
                          >
                            {t("Bank Transaction ID")}
                          </Typography>
                          <Typography variant="body1">
                            {payment?.bank_transaction_id || "—"}
                          </Typography>
                        </Grid>

                        <Grid item xs={12} sm={6}>
                          <Typography
                            variant="subtitle2"
                            color="text.secondary"
                          >
                            {t("Entity")}
                          </Typography>
                          <Typography variant="body1">
                            {payment.entity || "—"}
                          </Typography>
                        </Grid>

                        <Grid item xs={12} sm={6}>
                          <Typography
                            variant="subtitle2"
                            color="text.secondary"
                          >
                            {t("Payment Date Time")}
                          </Typography>
                          <Typography variant="body1">
                            {payment?.payment_date_time
                              ? formatToRiyadhTime(payment?.payment_date_time)
                              : "—"}
                          </Typography>
                        </Grid>

                        <Grid item xs={12}>
                          <Typography
                            variant="subtitle2"
                            color="text.secondary"
                          >
                            {t("Remarks")}
                          </Typography>
                          <Typography variant="body1">
                            {payment?.paymentremarks || "No remarks"}
                          </Typography>
                        </Grid>
                      </Grid>
                    </Grid>

                    {/* Right: Sync Button */}
                    {isUnsynced && (
                      <Grid
                        item
                        xs={12}
                        md={3}
                        textAlign={{ xs: "left", md: "right" }}
                      >
                        <Button
                          variant="contained"
                          color="primary"
                          onClick={handleSync}
                          disabled={syncLoading}
                          sx={{
                            borderRadius: "30px",
                            px: 3,
                            py: 1,
                            mt: { xs: 2, md: 0 },
                            fontWeight: 600,
                            boxShadow: 2,
                          }}
                        >
                          <Tooltip
                            title={syncLoading ? t("Syncing...") : t("Sync")}
                            arrow
                          >
                            <SyncIcon />
                          </Tooltip>
                        </Button>
                      </Grid>
                    )}
                  </Grid>
                </CardContent>
              </Card>
            )}

            {/* Payment Lines Section */}
          <Grid container spacing={3}>
  {paymentLines?.length > 0 ? (
    paymentLines?.map((line, index) => (
      <Grid item xs={12} sm={6} md={4} key={index}>
        <Card
          elevation={3}
          sx={{
            borderRadius: 3,
            height: "100%",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            transition: "transform 0.2s ease, box-shadow 0.2s ease",
            "&:hover": {
              transform: "translateY(-4px)",
              boxShadow: 6,
            },
          }}
        >
          <CardContent>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              {t("Order ID")}: {line?.orderId}
            </Typography>
            <Typography variant="h6" fontWeight={600}>
              {t("Amount")}: ₹ {parseFloat(line?.Amount)?.toLocaleString()}
            </Typography>
            <Typography variant="body2" color="text.secondary" mt={1}>
              {t("ERP Order ID")}: {line?.erpOrderId || "—"}
            </Typography>
          </CardContent>
        </Card>
      </Grid>
    ))
  ) : (
    <Grid item xs={12}>
      <Typography align="center" variant="body1" color="text.secondary">
        {t("No payment lines found")}
      </Typography>
    </Grid>
  )}
</Grid>

          </>
        )}
      </Container>
    </Sidebar>
  );
};

export default PaymentLines;
