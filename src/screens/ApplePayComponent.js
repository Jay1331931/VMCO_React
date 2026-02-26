import React, { useEffect, useState, useRef, useCallback } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Swal from "sweetalert2";
import { useTranslation } from "react-i18next";
import api from "../utilities/api";
import { parsePhoneNumberFromString } from "libphonenumber-js";
import { Lock, Payment, Mail, Phone } from "@mui/icons-material";
import { Chip } from "@mui/material";
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
} from "@mui/material";
// import { Payment } from "@mui/icons-material";
import Sidebar from "../components/Sidebar";

const ApplePayComponent = () => {
  const [sdkLoaded, setSdkLoaded] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const { orderId, amount, customerId, orderType } = useParams();
  const [customerDetails, setCustomerDetails] = useState(null);
  const { token } = useAuth();
  const { t, i18n } = useTranslation();
  const AppleContainerRef = useRef(null);
  
  // Add a key to force remount on language change
  const [componentKey, setComponentKey] = useState(Date.now());
const isFirstLoad = useRef(true);
const prevLanguageRef = useRef(i18n.language);
  const orderIdDecoded = atob(decodeURIComponent(orderId));
  const amountDecoded = atob(decodeURIComponent(amount));
  const customerIdDecoded = atob(decodeURIComponent(customerId));
  const orderTypeDecoded = atob(decodeURIComponent(orderType));
  const TAP_PUIBLIC_KEY = process.env.REACT_APP_PAYMENT_TAP_PUBLIC_KEY;
  const TAP_MERCHANT_ID = process.env.REACT_APP_TAP_MERCHANT_ID;
  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

  // Force remount when language changes
  useEffect(() => {
     if (prevLanguageRef.current !== i18n.language) {
        setComponentKey(Date.now());
    // Reset all states
    setSdkLoaded(false);
    setInitialized(false);
    setCustomerDetails(null);
    prevLanguageRef.current =i18n.language
    }
  
  }, [i18n.language]);

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
  }, [customerIdDecoded, token, componentKey]); // Add componentKey as dependency

  // Load Tap Apple Pay SDK
  useEffect(() => {
    // Check if SDK already exists and remove it if it does (for clean reload)
    if (window.TapApplepaySDK) {
      // Try to cleanup any existing instances
      try {
        delete window.TapApplepaySDK;
      } catch (e) {
        console.log("Could not delete existing SDK");
      }
    }

    const script = document.createElement("script");
    script.src = "https://tap-sdks.b-cdn.net/apple-pay/build-1.2.0/main.js";
    script.async = true;
    script.onload = () => setSdkLoaded(true);
    script.onerror = () => console.error("Failed to load Tap Apple Pay SDK");
    
    // Remove any existing script with same src
    const existingScript = document.querySelector(`script[src="${script.src}"]`);
    if (existingScript) {
      existingScript.remove();
    }
    
    document.head.appendChild(script);

    // Cleanup script on unmount
    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
      // Also try to cleanup SDK
      if (window.TapApplepaySDK) {
        try {
          delete window.TapApplepaySDK;
        } catch (e) {
          console.log("Could not delete SDK on cleanup");
        }
      }
    };
  }, [componentKey]); // Re-run when componentKey changes

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
      // Clear container first
      if (AppleContainerRef.current) {
        AppleContainerRef.current.innerHTML = '';
      }

      render(
        {
          publicKey: TAP_PUIBLIC_KEY,
          environment: Environment.Production,
          scope: Scope.TapToken,
          merchant: {
            id: TAP_MERCHANT_ID,
            domain: window.location.hostname,
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
            locale: i18n.language === "ar" ? Locale.AR : Locale.EN,
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
  }, [sdkLoaded, customerDetails, initialized, amountDecoded, i18n.language, componentKey]);

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
      window.location.replace(`${API_BASE_URL}/auth/payment/success?tap_id=${data?.data?.id}`);
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
 
    <Sidebar title={t("Apple Payment")}>
      <Box
        sx={{
          minHeight: "100vh",
          bgcolor: "#f8fafc",
          py: { xs: 2, md: 4 },
          px: { xs: 2, md: 4 },
        }}
      >
        {/* Header with Status */}
        <Box
          sx={{
            maxWidth: 1200,
            mx: "auto",
            mb: 3,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Box display="flex" alignItems="center" gap={2}>
            <Box
              sx={{
                bgcolor: "#000",
                color: "#fff",
                width: 40,
                height: 40,
                borderRadius: 2,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 20,
                fontWeight: 700,
              }}
            >
              T
            </Box>
            <Typography variant="h6" fontWeight={600} color="#1e293b">
              {t("TalabPoint Payments")}
            </Typography>
          </Box>
          {/* <Chip
            icon={<Lock sx={{ fontSize: 16 }} />}
            label={t("Secure Checkout")}
            size="small"
            sx={{
              bgcolor: "#e8f0fe",
              color: "#1a4cff",
              fontWeight: 500,
              "& .MuiChip-icon": { color: "#1a4cff" },
            }}
          /> */}
        </Box>

        {/* Main Content */}
        <Grid container spacing={3} sx={{ maxWidth: 1200, mx: "auto" }}>
          {/* Left Column - Payment Details */}
          <Grid item xs={12} md={7}>
            {/* Order Summary Card */}
            <Card
              sx={{
                borderRadius: 3,
                boxShadow: "0 4px 20px rgba(0,0,0,0.02)",
                border: "1px solid #eef2f6",
                mb: 3,
                overflow: "visible",
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Box display="flex" alignItems="center" gap={1} mb={3}>
                  <Box
                    sx={{
                      bgcolor: "#f0f4ff",
                      borderRadius: 2,
                      width: 32,
                      height: 32,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Payment sx={{ color: "#1a4cff", fontSize: 18 }} />
                  </Box>
                  <Typography variant="h6" fontWeight={600} color="#1e293b">
                    {t("Order Summary")}
                  </Typography>
                </Box>

                <Box sx={{ bgcolor: "#f8fafc", borderRadius: 2, p: 2.5 }}>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="#64748b">
                        {t("Amount")}
                      </Typography>
                      <Typography variant="h5" fontWeight={700} color="#1e293b">
                        {amountDecoded} <span style={{ fontSize: 14, fontWeight: 400, color: '#64748b' }}>SAR</span>
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="#64748b">
                        {t("Currency")}
                      </Typography>
                      <Typography variant="body1" fontWeight={600} color="#1e293b">
                        {t("Saudi Riyal")} (SAR)
                      </Typography>
                    </Grid>
                  </Grid>
                </Box>

                <Divider sx={{ my: 3 }} />

                {/* Customer Details */}
                <Box>
                  <Typography variant="subtitle2" fontWeight={600} color="#1e293b" mb={2}>
                    {t("Customer Information")}
                  </Typography>
                  
                  <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                    <Box display="flex" alignItems="center" gap={2}>
                      <Box
                        sx={{
                          width: 40,
                          height: 40,
                          bgcolor: "#f0f4ff",
                          borderRadius: 2,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Typography variant="body2" fontWeight={600} color="#1a4cff">
                          {customerDetails?.company_name_en?.charAt(0) || "C"}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="body2" color="#64748b">
                          {t("Customer Name")}
                        </Typography>
                        <Typography variant="body1" fontWeight={500} color="#1e293b">
                          {customerDetails?.company_name_en || "N/A"}
                        </Typography>
                      </Box>
                    </Box>

                    <Box display="flex" gap={2}>
                      <Box flex={1}>
                        <Typography variant="body2" color="#64748b" mb={0.5}>
                          {t("Email")}
                        </Typography>
                        <Box display="flex" alignItems="center" gap={1}>
                          <Mail sx={{ fontSize: 16, color: "#94a3b8" }} />
                          <Typography variant="body2" color="#1e293b">
                            {customerDetails?.contact_email || t("Not available")}
                          </Typography>
                        </Box>
                      </Box>
                      
                    </Box>
                    <Box flex={1}>
                        <Typography variant="body2" color="#64748b" mb={0.5}>
                          {t("Phone")}
                        </Typography>
                        <Box display="flex" alignItems="center" gap={1}>
                          <Phone sx={{ fontSize: 16, color: "#94a3b8" }} />
                          <Typography variant="body2" color="#1e293b">
                            {customerDetails?.contact_phone || t("Not available")}
                          </Typography>
                        </Box>
                      </Box>
                  </Box>
                </Box>
              </CardContent>
            </Card>

            {/* Accepted Cards */}
            {/* <Card
              sx={{
                borderRadius: 3,
                boxShadow: "0 4px 20px rgba(0,0,0,0.02)",
                border: "1px solid #eef2f6",
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Typography variant="subtitle2" fontWeight={600} color="#1e293b" mb={2}>
                  {t("Accepted Payment Methods")}
                </Typography>
                <Box display="flex" gap={2} alignItems="center">
                  <Box
                    sx={{
                      px: 2,
                      py: 1,
                      bgcolor: "#f8fafc",
                      borderRadius: 2,
                      border: "1px solid #eef2f6",
                    }}
                  >
                    <Typography variant="body2" fontWeight={600} color="#1e293b">
                      mada
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      px: 2,
                      py: 1,
                      bgcolor: "#f8fafc",
                      borderRadius: 2,
                      border: "1px solid #eef2f6",
                    }}
                  >
                    <Typography variant="body2" fontWeight={600} color="#1e293b">
                      Visa
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      px: 2,
                      py: 1,
                      bgcolor: "#f8fafc",
                      borderRadius: 2,
                      border: "1px solid #eef2f6",
                    }}
                  >
                    <Typography variant="body2" fontWeight={600} color="#1e293b">
                      MasterCard
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card> */}
          </Grid>

          {/* Right Column - Apple Pay */}
          <Grid item xs={12} md={5}>
            <Card
              sx={{
                borderRadius: 3,
                boxShadow: "0 20px 40px rgba(0,0,0,0.08)",
                border: "1px solid #eef2f6",
                position: "sticky",
                top: 24,
              }}
            >
              <CardHeader
                title={
                  <Box>
                    <Box display="flex" alignItems="center" gap={1.5} mb={1}>
                      <Box
                        sx={{
                          bgcolor: "#000",
                          borderRadius: 2,
                          width: 40,
                          height: 40,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Typography sx={{ color: "#fff", fontSize: 20, fontWeight: 600 }}>
                          
                        </Typography>
                      </Box>
                      <Typography variant="h6" fontWeight={700} color="#1e293b">
                        {t("Apple Pay")}
                      </Typography>
                    </Box>
                    <Typography variant="body2" color="#64748b">
                      {t("Pay securely with Apple Pay. Fast, private, and protected.")}
                    </Typography>
                  </Box>
                }
                sx={{ p: 3, pb: 0 }}
              />
              
              <CardContent sx={{ p: 3 }}>
                {/* Apple Pay Button Container */}
                <Box
                  sx={{
                    bgcolor: "#f8fafc",
                    borderRadius: 3,
                    p: 3,
                    mb: 3,
                    minHeight: 160,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    border: "2px dashed #e2e8f0",
                  }}
                >
                  {!sdkLoaded ? (
                    <Box textAlign="center">
                      <CircularProgress size={32} sx={{ color: "#1a4cff", mb: 2 }} />
                      <Typography variant="body2" color="#64748b">
                        {t("Initializing Apple Pay...")}
                      </Typography>
                    </Box>
                  ) : (
                    <>
                      <div
                        id="apple-pay-button"
                        ref={AppleContainerRef}
                        key={componentKey}
                        style={{
                          width: "100%",
                          minHeight: "50px",
                          opacity: initialized ? 1 : 0.5,
                          transition: "opacity 0.3s ease",
                          pointerEvents: initialized ? "auto" : "none",
                        }}
                      />
                      
                      {!initialized && (
                        <Box textAlign="center" mt={2}>
                          <CircularProgress size={24} sx={{ color: "#94a3b8" }} />
                          <Typography variant="caption" color="#94a3b8" sx={{ mt: 1, display: "block" }}>
                            {t("Preparing secure payment...")}
                          </Typography>
                        </Box>
                      )}
                    </>
                  )}
                </Box>

                {/* Features List */}
                {/* <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  <Box display="flex" alignItems="center" gap={1.5}>
                    <Box
                      sx={{
                        bgcolor: "#e6f7e6",
                        borderRadius: "50%",
                        width: 24,
                        height: 24,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Typography sx={{ color: "#00a86b", fontSize: 14 }}>✓</Typography>
                    </Box>
                    <Typography variant="body2" color="#1e293b">
                      {t("End-to-end encryption")}
                    </Typography>
                  </Box>
                  <Box display="flex" alignItems="center" gap={1.5}>
                    <Box
                      sx={{
                        bgcolor: "#e6f7e6",
                        borderRadius: "50%",
                        width: 24,
                        height: 24,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Typography sx={{ color: "#00a86b", fontSize: 14 }}>✓</Typography>
                    </Box>
                    <Typography variant="body2" color="#1e293b">
                      {t("Face ID / Touch ID authentication")}
                    </Typography>
                  </Box>
                  <Box display="flex" alignItems="center" gap={1.5}>
                    <Box
                      sx={{
                        bgcolor: "#e6f7e6",
                        borderRadius: "50%",
                        width: 24,
                        height: 24,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Typography sx={{ color: "#00a86b", fontSize: 14 }}>✓</Typography>
                    </Box>
                    <Typography variant="body2" color="#1e293b">
                      {t("No card details shared with merchant")}
                    </Typography>
                  </Box>
                </Box> */}

                {/* Processing State Overlay */}
                {isProcessing && (
                  <Box
                    sx={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      bgcolor: "rgba(255,255,255,0.9)",
                      backdropFilter: "blur(4px)",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      borderRadius: 3,
                      zIndex: 10,
                    }}
                  >
                    <CircularProgress size={48} sx={{ color: "#1a4cff", mb: 2 }} />
                    <Typography variant="h6" fontWeight={600} color="#1e293b">
                      {t("Processing Payment")}
                    </Typography>
                    <Typography variant="body2" color="#64748b">
                      {t("Please don't close this window")}
                    </Typography>
                  </Box>
                )}
              </CardContent>

              {/* Footer */}
              {/* <Box
                sx={{
                  p: 3,
                  pt: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 1,
                }}
              >
                <Lock sx={{ fontSize: 14, color: "#94a3b8" }} />
                <Typography variant="caption" color="#94a3b8">
                  {t("256-bit SSL encrypted payment")}
                </Typography>
              </Box> */}
            </Card>
          </Grid>
        </Grid>

        {/* Footer Note */}
        {/* <Box
          sx={{
            maxWidth: 1200,
            mx: "auto",
            mt: 4,
            textAlign: "center",
          }}
        >
          <Typography variant="caption" color="#94a3b8">
            {t("Powered by Tap Payments • Protected by PCI DSS Level 1")}
          </Typography>
        </Box> */}
      </Box>
    </Sidebar>

  );
};

export default ApplePayComponent;