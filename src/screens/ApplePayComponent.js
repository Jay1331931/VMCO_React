import React, { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Swal from "sweetalert2";
import { useTranslation } from "react-i18next";
import api from "../utilities/api";
import { parsePhoneNumberFromString } from "libphonenumber-js";

// MUI Imports
import {
  Card,
  CardContent,
  CardHeader,
  Grid,
  Typography,
  CircularProgress,
  Divider,
  Box,
  Fade,
  Chip,
} from "@mui/material";
import { Lock, Payment } from "@mui/icons-material";

const ApplePayComponent = () => {
  const [sdkLoaded, setSdkLoaded] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const { orderId, amount, customerId, orderType } = useParams();
  const [customerDetails, setCustomerDetails] = useState(null);
  const { token } = useAuth();
  const { t } = useTranslation();
  const AppleContainerRef = useRef(null);

  const orderIdDecoded = atob(decodeURIComponent(orderId));
  const amountDecoded = atob(decodeURIComponent(amount));
  const customerIdDecoded = atob(decodeURIComponent(customerId));
  const orderTypeDecoded = atob(decodeURIComponent(orderType));
  const TAP_PUIBLIC_KEY = process.env.REACT_APP_PAYMENT_TAP_PUBLIC_KEY;
  const TAP_MERCHANT_ID = process.env.REACT_APP_TAP_MERCHANT_ID;
    const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;
  // Fetch customer details
  useEffect(() => {
    const fetchCustomerDetails = async () => {
      try {
        const { data } = await api.get(
          `/get_customer_details?customerId=${customerIdDecoded}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setCustomerDetails(data?.details);
      } catch (error) {
        console.error("Failed to fetch customer details", error);
      }
    };
    if (customerIdDecoded) fetchCustomerDetails();
  }, [customerIdDecoded, token]);

  // Load Tap Apple Pay SDK
  useEffect(() => {
    if (window.TapApplepaySDK) {
      setSdkLoaded(true);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://tap-sdks.b-cdn.net/apple-pay/build-1.2.0/main.js";
    script.async = true;
    script.onload = () => setSdkLoaded(true);
    script.onerror = () => console.error("Failed to load Tap Apple Pay SDK");
    document.head.appendChild(script);
  }, []);

  // Format phone number
  let phone;
  if (customerDetails?.contact_phone) {
    const parsed = parsePhoneNumberFromString(customerDetails.contact_phone);
    if (parsed?.isValid()) {
      phone = {
        countryCode: parsed.countryCallingCode,
        number: parsed.nationalNumber,
      };
    }
  }

  // Initialize Apple Pay SDK
  useEffect(() => {
    if (!sdkLoaded || !customerDetails || initialized) return;

    const { render, ThemeMode, Scope, Environment, Locale, ButtonType, Edges } =
      window.TapApplepaySDK;

    try {
      render(
        {
          publicKey: TAP_PUIBLIC_KEY, //pk_live_2HRpZ8j0xdA4l1kriu5EJo7B
          environment: Environment.Production,
          scope: Scope.TapToken,
          merchant: {
            id: TAP_MERCHANT_ID, //
            domain: window.location.hostname, // talabpoint.com,
          },
          transaction: {
            currency: "SAR",
            amount: amountDecoded,
          },
          acceptance: {
            supportedBrands: ["mada", "masterCard", "visa"],
          },
          features: {
            supportsCouponCode: false,
          },
          customer: {
            id: customerDetails?.tap_cust_id,
            name: [
              {
                locale: "en",
                first: customerDetails?.company_name_en || "Customer",
              },
            ],
            contact: {
              email: customerDetails?.contact_email,
              phone,
            },
          },
          interface: {
            locale: Locale.EN,
            theme: ThemeMode.DARK,
            type: ButtonType.BUY,
            edges: Edges.CURVED,
          },
          onCancel: () => console.log("❌ Apple Pay cancelled"),
          onError: (error) => console.error("⚠️ Apple Pay error:", error),
          onSuccess: (data) => handleSuccess(data),
          onReady: () => {
            console.log("✅ Apple Pay button ready");
            setInitialized(true);
          },
        },
        AppleContainerRef.current?.id
      );
    } catch (error) {
      console.error("Error initializing Apple Pay:", error);
    }
  }, [sdkLoaded, customerDetails, initialized, amountDecoded]);

  // Handle payment success
  const handleSuccess = async (paymentData) => {
    try {
      setIsProcessing(true);
      const payload = {
        salesOrderId: orderIdDecoded,
        amount: amountDecoded,
        customerName: customerDetails?.company_name_en,
        tokenData: paymentData,
        orderType: orderTypeDecoded,
      };
      const { data } = await api.post(`/payment/generate-link`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      window.location.replace(`${API_BASE_URL}/auth/payment/success?tap_id=${data?.data?.id}`)
      // await api.get(`/auth/payment/success?tap_id=${data?.data?.id}`);
    } catch (error) {
      console.error("Failed to create charge request", error);
      Swal.fire({
        title: t("Error"),
        text: t("Payment failed. Please try again."),
        icon: "error",
        confirmButtonText: t("OK"),
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        alignItems: "flex-start",
        minHeight: "90vh",
        bgcolor: "#f7f9fb",
        py: 5,
        px: 2,
      }}
    >
      <Card
        sx={{
          maxWidth: 800,
          width: "100%",
          borderRadius: 4,
          boxShadow: 6,
          transition: "0.3s ease",
          "&:hover": { boxShadow: 10 },
        }}
      >
        <CardHeader
          title={
            <Box
              display="flex"
              alignItems="center"
              justifyContent="center"
              gap={1}
            >
              <Payment color="primary" />
              <Typography variant="h5" fontWeight={700}  onClick={() => handleSuccess("data")}>
                Apple Payment 1
              </Typography>
            </Box>
          }
          subheader="Complete your payment securely using Tap Apple Pay"
          sx={{ textAlign: "center", pb: 0 }}
        />
        <Divider sx={{ my: 2 }} />

        <CardContent>
          {!customerDetails ? (
            <Box textAlign="center" py={5}>
              <CircularProgress />
              <Typography sx={{ mt: 2 }}>
                Loading customer details...
              </Typography>
            </Box>
          ) : (
            <Grid container spacing={4}>
              {/* Payment Info */}
              <Grid item xs={12} md={6}>
                <Typography variant="h6" fontWeight={600}>
                  Payment Details
                </Typography>
                <Divider sx={{ mb: 2, mt: 1 }} />

                <Box sx={{ lineHeight: 2 }}>
                  <Typography>
                    <strong>Amount:</strong> {amountDecoded} SAR
                  </Typography>
                  <Typography>
                    <strong>Currency:</strong> Saudi Riyal (SAR)
                  </Typography>
                  <Typography>
                    <strong>Customer:</strong>{" "}
                    {customerDetails?.company_name_en || "N/A"}
                  </Typography>
                  <Typography>
                    <strong>Phone:</strong>{" "}
                    {customerDetails?.contact_phone || "Not available"}
                  </Typography>
                  <Typography>
                    <strong>Email:</strong>{" "}
                    {customerDetails?.contact_email || "Not available"}
                  </Typography>
                </Box>
              </Grid>

              {/* Apple Pay Button */}
              <Grid item xs={12} md={6} textAlign="center">
                <Typography variant="h6" fontWeight={600}>
                  Apple Pay Information
                </Typography>
                <Divider sx={{ mb: 2, mt: 1 }} />
                <div
                  id="apple-pay-button"
                  ref={AppleContainerRef}
                  style={{
                    display: sdkLoaded ? "block" : "none",
                    minHeight: "60px",
                    opacity: initialized ? 1 : 0.3,
                    transition: "opacity 0.4s ease",
                    pointerEvents: initialized ? "auto" : "none",
                  }}
                />
                {!initialized && sdkLoaded && (
                  <Typography color="text.secondary" mt={1}>
                    Preparing Apple Pay...
                  </Typography>
                )}
              </Grid>
            </Grid>
          )}

          {/* Footer Note */}
          <Divider sx={{ mt: 4, mb: 2 }} />
          {/* <Box textAlign="center">
              <Lock sx={{ verticalAlign: "middle", color: "success.main" }} />
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mt: 1 }}
              >
                Your payment is secure and encrypted 🔒
              </Typography>
              <Chip
                label="Supported: MADA, Visa, Mastercard"
                variant="outlined"
                color="primary"
                sx={{ mt: 1 }}
              />
            </Box> */}

          {/* Processing State */}
          {isProcessing && (
            <Box textAlign="center" mt={3}>
              <CircularProgress color="success" />
              <Typography mt={2} color="success.main" fontWeight={500}>
                {t("Processing your payment...")}
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default ApplePayComponent;
