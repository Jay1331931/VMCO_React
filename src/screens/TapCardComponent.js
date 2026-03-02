import axios from "axios";
import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Swal from "sweetalert2";
import { useTranslation } from "react-i18next";
import api from "../utilities/api";
import { parsePhoneNumberFromString } from "libphonenumber-js";
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Typography,
  Divider,
  Grid,
  CircularProgress,
  Chip,
  Paper,
  Avatar,
  Stack,
  Button,
} from "@mui/material";
import {
  Lock,
  Payment,
  CreditCard,
  Security,
  VerifiedUser,
  ArrowForward,
  WhatsApp,
  Email,
  Phone,
  Business,
} from "@mui/icons-material";
// import { Lock, Payment } from "@mui/icons-material";

import Sidebar from "../components/Sidebar";
function getCenteredOptions(width, height) {
  const screenWidth = window.screen.width;
  const screenHeight = window.screen.height;

  // Calculate centered position
  const left = Math.max(0, (screenWidth - width) / 2);
  const top = Math.max(0, (screenHeight - height) / 2);

  return {
    left: Math.round(left),
    top: Math.round(top),
  };
}
const TapCardPayment = () => {
  const [sdkLoaded, setSdkLoaded] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const { orderId, amount, customerId, orderType } = useParams();
  const [CustomerDetails, setCustomerDetails] = useState(null);
  const [CardDetails, setCardDetails] = useState(null);
  const [selectedCardId, setSelectedCardId] = useState(null);
  const [isCardselected, setisCardselected] = useState(false);
  const [isPayButtonValid, setisPayButtonValid] = useState(false);
  const [showCardForm, setShowCardForm] = useState(true);
  const [isNewCard, setIsNewCard] = useState(false);
  const { token } = useAuth();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  const orderIdDecoded = atob(decodeURIComponent(orderId));
  const amountDecoded = atob(decodeURIComponent(amount));
  const customerIdDecoded = atob(decodeURIComponent(customerId));
  const orderTypeDecoded = atob(decodeURIComponent(orderType));
  const TAP_PUIBLIC_KEY = process.env.REACT_APP_PAYMENT_TAP_PUBLIC_KEY;
  const TAP_MERCHANT_ID = process.env.REACT_APP_TAP_MERCHANT_ID;
  // Fetch customer details
  useEffect(() => {
    const fetchCustomerDetails = async () => {
      try {
        const token = localStorage.getItem("token");
        const { data } = await api.get(
          `/get_customer_details?customerId=${customerIdDecoded}`,
          { headers: { Authorization: `Bearer ${token}` } },
        );
        setCustomerDetails(data?.details);
      } catch (error) {
        console.error("Failed to fetch Customer details", error);
      }
    };
    if (customerIdDecoded) fetchCustomerDetails();
  }, [customerIdDecoded]);

  // Fetch saved card details
  useEffect(() => {
    const fetchCardDetails = async () => {
      try {
        const { data } = await api.get(
          `get_card_detrails?TapCustId=${CustomerDetails?.tap_cust_id}`,
          { headers: { Authorization: `Bearer ${token}` } },
        );
        if (data.details?.length > 0 && data.success) {
          setCardDetails(data.details);
          setisCardselected(true);
        } else {
          setisCardselected(false);
          initializeTapCard();
        }
      } catch (error) {
        console.error("Failed to fetch Card details", error);
      }
    };
    if (CustomerDetails?.tap_cust_id) fetchCardDetails();
    else initializeTapCard();
  }, [CustomerDetails]);

  // Load Tap SDK
  useEffect(() => {
    if (window.CardSDK) {
      setSdkLoaded(true);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://tap-sdks.b-cdn.net/card/1.0.2/index.js";
    script.async = true;
    script.onload = () => setSdkLoaded(true);
    script.onerror = () => console.error("Failed to load Tap Card SDK");
    document.head.appendChild(script);
  }, []);

  // Phone formatting
  let customerPhone;
  if (CustomerDetails?.contact_phone)
    customerPhone = parsePhoneNumberFromString(CustomerDetails?.contact_phone);

  let phone;
  if (customerPhone && customerPhone.isValid()) {
    phone = {
      countryCode: customerPhone.countryCallingCode,
      number: customerPhone.nationalNumber,
    };
  }

  const handleCardSelection = (id) => {
    setSelectedCardId(id);
    setisCardselected(false);
    initializeTapCard(id);
  };

  // Initialize Tap card widget
  const initializeTapCard = (selectedCard = null) => {
    if (window.CardSDK && !initialized) {
      const {
        renderTapCard,
        Theme,
        Currencies,
        Direction,
        Edges,
        Locale,
        loadSavedCard,
      } = window.CardSDK;
      try {
        const container = document.getElementById("card-sdk-container");
        if (!container) {
          Swal.fire({
            title: t("Error"),
            text: t("Container not found"),
            icon: "error",
            confirmButtonText: t("OK"),
          });
          return;
        }

        container.innerHTML = "";
        const sdkElement = document.createElement("div");
        sdkElement.id = "card-sdk-id";
        container.appendChild(sdkElement);

        renderTapCard("card-sdk-id", {
          publicKey: TAP_PUIBLIC_KEY, //"pk_test_FcYVGop4TyCRLb0qBhIHJzmn",
          merchant: { id: TAP_MERCHANT_ID }, //{ id: "67979587" },
          transaction: {
            amount: parseFloat(amountDecoded),
            currency: Currencies.SAR,
          },
          customer: {
            id: CustomerDetails?.tap_cust_id || "",
            name: [
              {
                lang: i18n.language === "ar" ? Locale.AR : Locale.EN,
                first: CustomerDetails?.company_name_en,
              },
            ],
            editable: true,
            contact: { email: CustomerDetails?.contact_email, phone },
          },
          acceptance: {
            supportedBrands: ["MADA", "VISA", "MASTERCARD"],
            supportedCards: "ALL",
          },
          fields: { cardHolder: true },
          addons: { displayPaymentBrands: true, loader: true, saveCard: true },
          interface: {
            locale: Locale.EN,
            theme: Theme.LIGHT,
            edges: Edges.CURVED,
            direction: Direction.LTR,
          },
          onReady: () => {
            if (selectedCard) loadSavedCard(selectedCard);
            setInitialized(true);
            setIsNewCard(false);
          },
          onValidInput: (data) => {
            setIsProcessing(!data);
            setisPayButtonValid(data);
          },
          onError: (data) => {
            console.log("onError", data);
            setIsProcessing(false);
          },
          onSuccess: (data) => createChargeRequest(data),
        });
      } catch (error) {
        console.error("Error initializing Tap Card:", error);
      }
    }
  };

  const createToken = () => {
    if (window.CardSDK?.tokenize) {
      setPaymentProcessing(true);
      setIsProcessing(true);
      window.CardSDK.tokenize();
    } else {
      Swal.fire({
        title: t("Error"),
        text: t("Payment system not ready. Please try again."),
        icon: "error",
        confirmButtonText: t("OK"),
      });
    }
    setisPayButtonValid(false);
  };

  const createChargeRequest = async (tokenDATA) => {
    setShowCardForm(false);
    setPaymentProcessing(true);
    try {
      const payload = {
        salesOrderId: orderIdDecoded,
        amount: amountDecoded,
        customerName: CustomerDetails?.company_name_en,
        tokenData: tokenDATA,
        orderType: orderTypeDecoded,
      };

      const { data } = await api.post(`/payment/generate-link`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (
        data?.status?.toLowerCase() === "error" &&
        data?.details?.errors?.length > 0
      ) {
        const errorMessage = data.details.errors
          .map((err) => `${err.code} - ${err.description}`)
          .join("\n");

        Swal.fire({
          icon: "error",
          title: t("Payment Error"),
          text: errorMessage || t("Something went wrong during payment."),
          confirmButtonColor: "#0b4c45",
        });
        setShowCardForm(true);
        return;
      }
      if (data?.data?.transaction?.url) {
        const paymentUrl = data.data?.transaction?.url;
        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

        if (isMobile) {
          // For iOS: use window.open with _blank to open Safari
          // For Android: InAppBrowser if available, otherwise window.open
          navigate("/catalog");
          if (window.cordova && window.cordova.InAppBrowser) {
            // Try InAppBrowser for Android
            const width = 400;
            const height = 500;
            const centeredPosition = getCenteredOptions(width, height);
            const options =
              "toolbar=yes," +
              "hideurlbar=yes," +
              "zoom=no," +
              "hardwareback=yes," +
              "clearsessioncache=yes," +
              "clearcache=yes," +
              "width=" +
              width +
              "," +
              "height=" +
              height +
              "," +
              "left=" +
              centeredPosition.left +
              "," +
              "top=" +
              centeredPosition.top;
            window.cordova.InAppBrowser.open(paymentUrl, "_blank", options);
          } else {
            // iOS fallback: use window.open with _blank to open Safari
            window.open(paymentUrl, "_blank");
            console.log("[Tap Debug] Opened with window.open (iOS Safari)");
          }
        } else {
          window.location.replace(paymentUrl);
        }
      }
    } catch (error) {
      if (
        error.response?.data?.status?.toLowerCase() === "error" &&
        error.response?.data?.details?.errors?.length > 0
      ) {
        const errorMessage = error?.response?.data?.details?.errors
          .map((err) => `${err.code} - ${err.description}`)
          .join("\n");

        Swal.fire({
          icon: "error",
          title: t("Payment Error"),
          text: errorMessage || t("Something went wrong during payment."),
          confirmButtonColor: "#0b4c45",
        });
        setShowCardForm(true);
        return;
      }
      console.error("Failed to create charge request", error);
    } finally {
      setTimeout(() => {
        setIsProcessing(false);
        setPaymentProcessing(false);
      }, 100);
    }
  };

  return (
    <Sidebar title={t("Tap Payment")}>
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
            maxWidth: 1000,
            mx: "auto",
            mb: 3,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Box display="flex" alignItems="center" gap={2}>
            <Avatar
              sx={{
                bgcolor: "#0b4c45",
                width: 40,
                height: 40,
                borderRadius: 2,
              }}
            >
              <Payment sx={{ fontSize: 20 }} />
            </Avatar>
            <Box>
              <Typography variant="h6" fontWeight={600} color="#1e293b">
                {t("TalabPoint Payments")}
              </Typography>
              {/* <Typography variant="caption" color="#64748b">
                {t("Powered by Tap")}
              </Typography> */}
            </Box>
          </Box>
          {/* <Chip
            icon={<Lock sx={{ fontSize: 16 }} />}
            label={t("Secure Checkout")}
            size="small"
            sx={{
              bgcolor: "#e8f0fe",
              color: "#0b4c45",
              fontWeight: 500,
              "& .MuiChip-icon": { color: "#0b4c45" },
            }}
          /> */}
        </Box>

        {/* Main Content */}
        <Grid container spacing={3} sx={{ maxWidth: 1000, mx: "auto" }}>
          {/* Left Column - Order Details */}
          <Grid item xs={12} md={5}>
            {/* Order Summary Card */}
            <Card
              sx={{
                borderRadius: 3,
                boxShadow: "0 4px 20px rgba(0,0,0,0.02)",
                border: "1px solid #eef2f6",
                mb: 3,
                position: "sticky",
                top: 24,
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Box display="flex" alignItems="center" gap={1} mb={3}>
                  <Box
                    sx={{
                      bgcolor: "#e8f0fe",
                      borderRadius: 2,
                      width: 32,
                      height: 32,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Payment sx={{ color: "#0b4c45", fontSize: 18 }} />
                  </Box>
                  <Typography variant="h6" fontWeight={600} color="#1e293b">
                    {t("Order Summary")}
                  </Typography>
                </Box>

                {/* Amount Card */}
                <Paper
                  elevation={0}
                  sx={{
                    bgcolor: "#f8fafc",
                    borderRadius: 3,
                    p: 3,
                    mb: 3,
                    border: "1px solid #eef2f6",
                  }}
                >
                  <Box
                    display="flex"
                    justifyContent="space-between"
                    alignItems="center"
                  >
                    <Box>
                      <Typography variant="body2" color="#64748b" gutterBottom>
                        {t("Total Amount")}
                      </Typography>
                      <Typography variant="h4" fontWeight={700} color="#0b4c45">
                        {amountDecoded}{" "}
                        <span
                          style={{
                            fontSize: 16,
                            fontWeight: 400,
                            color: "#64748b",
                          }}
                        >
                          SAR
                        </span>
                      </Typography>
                    </Box>
                    {/* <Box
                      sx={{
                        bgcolor: "#0b4c45",
                        borderRadius: 2,
                        px: 2,
                        py: 1,
                      }}
                    >
                      <Typography variant="body2" fontWeight={600} color="#fff">
                        {t("Due Now")}
                      </Typography>
                    </Box> */}
                  </Box>
                </Paper>

                {/* Customer Details */}
                <Box>
                  <Typography
                    variant="subtitle2"
                    fontWeight={600}
                    color="#1e293b"
                    mb={2}
                  >
                    {t("Customer Details")}
                  </Typography>

                  <Stack spacing={2}>
                    <Box display="flex" alignItems="center" gap={2}>
                      <Avatar
                        sx={{ bgcolor: "#e8f0fe", width: 40, height: 40 }}
                      >
                        <Business sx={{ color: "#0b4c45", fontSize: 20 }} />
                      </Avatar>
                      <Box>
                        <Typography variant="body2" color="#64748b">
                          {t("Business Name")}
                        </Typography>
                        <Typography
                          variant="body1"
                          fontWeight={500}
                          color="#1e293b"
                          sx={{
                            wordBreak: "break-word",
                            overflowWrap: "break-word",
                            maxWidth: "100%",
                            lineHeight: 1.4,
                          }}
                        >
                          {CustomerDetails?.company_name_en || "N/A"}
                        </Typography>
                      </Box>
                    </Box>

                    <Box display="flex" alignItems="center" gap={2}>
                      <Avatar
                        sx={{ bgcolor: "#e8f0fe", width: 40, height: 40 }}
                      >
                        <Email sx={{ color: "#0b4c45", fontSize: 20 }} />
                      </Avatar>
                      <Box>
                        <Typography variant="body2" color="#64748b">
                          {t("Email")}
                        </Typography>
                        <Typography
                          variant="body1"
                          fontWeight={500}
                          color="#1e293b"
                          sx={{
                            wordBreak: "break-word",
                            overflowWrap: "break-word",
                            maxWidth: "100%",
                            lineHeight: 1.4,
                          }}
                        >
                          {CustomerDetails?.contact_email || t("Not available")}
                        </Typography>
                      </Box>
                    </Box>

                    <Box display="flex" alignItems="center" gap={2}>
                      <Avatar
                        sx={{ bgcolor: "#e8f0fe", width: 40, height: 40 }}
                      >
                        <Phone sx={{ color: "#0b4c45", fontSize: 20 }} />
                      </Avatar>
                      <Box>
                        <Typography variant="body2" color="#64748b">
                          {t("Phone")}
                        </Typography>
                        <Typography
                          variant="body1"
                          fontWeight={500}
                          color="#1e293b"
                        >
                          {CustomerDetails?.contact_phone || t("Not available")}
                        </Typography>
                      </Box>
                    </Box>
                  </Stack>
                </Box>

                <Divider sx={{ my: 3 }} />

                {/* Accepted Cards */}
                <Box>
                  <Typography
                    variant="subtitle2"
                    fontWeight={600}
                    color="#1e293b"
                    mb={2}
                  >
                    {t("Accepted Cards")}
                  </Typography>
                  <Box display="flex" gap={1} flexWrap="wrap">
                    {["MADA", "Visa", "Mastercard"].map((card) => (
                      <Chip
                        key={card}
                        label={card}
                        size="small"
                        sx={{
                          bgcolor: "#f1f5f9",
                          color: "#475569",
                          fontWeight: 500,
                          "&:hover": { bgcolor: "#e2e8f0" },
                        }}
                      />
                    ))}
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Right Column - Payment Section */}
          <Grid item xs={12} md={7}>
            <Card
              sx={{
                borderRadius: 3,
                boxShadow: "0 20px 40px rgba(0,0,0,0.08)",
                border: "1px solid #eef2f6",
                overflow: "visible",
              }}
            >
              <CardHeader
                title={
                  <Box>
                    <Box display="flex" alignItems="center" gap={1.5} mb={1}>
                      <Box
                        sx={{
                          bgcolor: "#0b4c45",
                          borderRadius: 2,
                          width: 40,
                          height: 40,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <CreditCard sx={{ color: "#fff", fontSize: 22 }} />
                      </Box>
                      <Typography variant="h6" fontWeight={700} color="#1e293b">
                        {t("Payment Method")}
                      </Typography>
                    </Box>
                    <Typography
                      variant="body2"
                      color="#64748b"
                      sx={{
                        wordBreak: "break-word",
                        overflowWrap: "break-word",
                        maxWidth: "100%",
                        lineHeight: 1.4,
                      }}
                    >
                      {t("Choose a saved card or add a new one")}
                    </Typography>
                  </Box>
                }
                sx={{ p: 3, pb: 0 }}
              />

              <CardContent sx={{ p: 3 }}>
                {/* Saved Cards Section */}
                {!initialized &&
                  sdkLoaded &&
                  CardDetails?.length > 0 &&
                  !selectedCardId && (
                    <Box sx={{ mb: 4 }}>
                      <Typography
                        variant="subtitle1"
                        fontWeight={600}
                        color="#1e293b"
                        mb={2}
                      >
                        {t("Your Saved Cards")}
                      </Typography>

                      <Stack spacing={2}>
                        {CardDetails?.map((card) => (
                          <Paper
                            key={card.id}
                            onClick={() => handleCardSelection(card.id)}
                            elevation={0}
                            sx={{
                              p: 2,
                              borderRadius: 2,
                              border:
                                selectedCardId === card.id
                                  ? "2px solid #0b4c45"
                                  : "1px solid #e2e8f0",
                              bgcolor:
                                selectedCardId === card.id ? "#e8f4f2" : "#fff",
                              cursor: "pointer",
                              transition: "all 0.2s",
                              "&:hover": {
                                borderColor: "#0b4c45",
                                boxShadow: "0 4px 12px rgba(11,76,69,0.1)",
                              },
                            }}
                          >
                            <Box
                              display="flex"
                              alignItems="center"
                              justifyContent="space-between"
                            >
                              <Box display="flex" alignItems="center" gap={2}>
                                <Avatar
                                  sx={{
                                    bgcolor: "#0b4c45",
                                    width: 48,
                                    height: 48,
                                  }}
                                >
                                  <CreditCard sx={{ color: "#fff" }} />
                                </Avatar>
                                <Box>
                                  <Typography
                                    variant="subtitle2"
                                    fontWeight={600}
                                    color="#1e293b"
                                  >
                                    {card.brand} •••• {card.last_four}
                                  </Typography>
                                  <Typography variant="caption" color="#64748b">
                                    {card.name} • Expires {card.exp_month}/
                                    {card.exp_year}
                                  </Typography>
                                </Box>
                              </Box>
                              {selectedCardId === card.id && (
                                <VerifiedUser
                                  sx={{ color: "#0b4c45", fontSize: 20 }}
                                />
                              )}
                            </Box>
                          </Paper>
                        ))}
                      </Stack>

                      <Button
                        fullWidth
                        variant="outlined"
                        onClick={() => {
                          // setIsCardSelected(false);
                          setIsNewCard(true);
                          setCardDetails(null);
                          initializeTapCard();
                          setShowCardForm(true);
                        }}
                        sx={{
                          mt: 3,
                          borderColor: "#0b4c45",
                          color: "#0b4c45",
                          borderRadius: 2,
                          py: 1.5,
                          "&:hover": {
                            borderColor: "#0a3d37",
                            bgcolor: "#e8f4f2",
                          },
                        }}
                      >
                        + {t("Add New Card")}
                      </Button>
                    </Box>
                  )}

                {/* Card SDK Container */}
                {(selectedCardId || isNewCard) && !initialized && (
                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      bgcolor: "#f8fafc",
                      borderRadius: 3,
                      p: 6,
                      border: "2px dashed #e2e8f0",
                    }}
                  >
                    <CircularProgress
                      size={48}
                      sx={{ color: "#0b4c45", mb: 3 }}
                    />
                    <Typography variant="h6" fontWeight={600} color="#1e293b">
                      {t("Loading Payment Gateway")}
                    </Typography>
                    <Typography
                      variant="body2"
                      color="#64748b"
                      sx={{
                        mt: 1,
                        wordBreak: "break-word",
                        overflowWrap: "break-word",
                        maxWidth: "100%",
                        lineHeight: 1.4,
                      }}
                    >
                      {t("Please wait while we secure your connection")}
                    </Typography>
                  </Box>
                )}
                <div
                  id="card-sdk-container"
                  style={{
                    display:
                      initialized && !paymentProcessing && showCardForm
                        ? "block"
                        : "none",
                  }}
                />

                {/* Loading State */}
                {!sdkLoaded && (
                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      bgcolor: "#f8fafc",
                      borderRadius: 3,
                      p: 6,
                      border: "2px dashed #e2e8f0",
                    }}
                  >
                    <CircularProgress
                      size={48}
                      sx={{ color: "#0b4c45", mb: 3 }}
                    />
                    <Typography variant="h6" fontWeight={600} color="#1e293b">
                      {t("Loading Payment Gateway")}
                    </Typography>
                    <Typography
                      variant="body2"
                      color="#64748b"
                      sx={{
                        mt: 1,
                        wordBreak: "break-word",
                        overflowWrap: "break-word",
                        maxWidth: "100%",
                        lineHeight: 1.4,
                      }}
                    >
                      {t("Please wait while we secure your connection")}
                    </Typography>
                  </Box>
                )}

                {/* Processing State */}
                {(paymentProcessing || !showCardForm) && sdkLoaded && (
                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      bgcolor: "#f8fafc",
                      borderRadius: 3,
                      p: 6,
                      border: "2px dashed #e2e8f0",
                    }}
                  >
                    <CircularProgress
                      size={48}
                      sx={{ color: "#0b4c45", mb: 3 }}
                    />
                    <Typography variant="h6" fontWeight={600} color="#1e293b">
                      {t("Processing Your Payment...")}
                    </Typography>
                    <Typography
                      variant="body2"
                      color="#64748b"
                      sx={{
                        mt: 1,
                        wordBreak: "break-word",
                        overflowWrap: "break-word",
                        maxWidth: "100%",
                        lineHeight: 1.4,
                      }}
                    >
                      {t("Please don't close this window")}
                    </Typography>
                  </Box>
                )}

                {/* Pay Button */}
                {isPayButtonValid && (
                  <Button
                    fullWidth
                    variant="contained"
                    onClick={createToken}
                    disabled={isProcessing || !initialized}
                    sx={{
                      mt: 3,
                      bgcolor: "#0b4c45",
                      color: "#fff",
                      py: 2,
                      borderRadius: 2,
                      fontSize: "16px",
                      fontWeight: 600,
                      "&:hover": {
                        bgcolor: "#0a3d37",
                      },
                      "&:disabled": {
                        bgcolor: "#94a3b8",
                      },
                    }}
                  >
                    {isProcessing ? (
                      <Box display="flex" alignItems="center" gap={1}>
                        <CircularProgress size={20} sx={{ color: "#fff" }} />
                        {t("Processing...")}
                      </Box>
                    ) : (
                      <Box display="flex" alignItems="center" gap={1}>
                        {t("Confirm & Pay")} {amountDecoded} SAR
                        <ArrowForward sx={{ fontSize: 20 }} />
                      </Box>
                    )}
                  </Button>
                )}

                {/* Security Badges */}
                {/* <Box
                  sx={{
                    mt: 4,
                    pt: 3,
                    borderTop: "1px solid #eef2f6",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 3,
                    flexWrap: "wrap",
                  }}
                >
                  <Box display="flex" alignItems="center" gap={1}>
                    <Security sx={{ fontSize: 18, color: "#0b4c45" }} />
                    <Typography variant="caption" color="#64748b">
                      {t("PCI DSS Compliant")}
                    </Typography>
                  </Box>
                  <Box display="flex" alignItems="center" gap={1}>
                    <Lock sx={{ fontSize: 18, color: "#0b4c45" }} />
                    <Typography variant="caption" color="#64748b">
                      {t("256-bit SSL Encryption")}
                    </Typography>
                  </Box>
                  <Box display="flex" alignItems="center" gap={1}>
                    <VerifiedUser sx={{ fontSize: 18, color: "#0b4c45" }} />
                    <Typography variant="caption" color="#64748b">
                      {t("3D Secure")}
                    </Typography>
                  </Box>
                </Box> */}
              </CardContent>
            </Card>

            {/* Support Section */}
            {/* <Paper
              elevation={0}
              sx={{
                mt: 2,
                p: 2,
                borderRadius: 2,
                bgcolor: "#f8fafc",
                border: "1px solid #eef2f6",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 3,
              }}
            >
              <Typography variant="caption" color="#64748b">
                {t("Need help?")}
              </Typography>
              <Box display="flex" alignItems="center" gap={1}>
                <WhatsApp sx={{ fontSize: 16, color: "#25D366" }} />
                <Typography variant="caption" color="#1e293b" fontWeight={500}>
                  +966 XX XXX XXXX
                </Typography>
              </Box>
              <Box display="flex" alignItems="center" gap={1}>
                <Email sx={{ fontSize: 16, color: "#0b4c45" }} />
                <Typography variant="caption" color="#1e293b" fontWeight={500}>
                  support@talabpoint.com
                </Typography>
              </Box>
            </Paper> */}
          </Grid>
        </Grid>

        {/* Footer */}
        {/* <Box
          sx={{
            maxWidth: 1000,
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

export default TapCardPayment;
