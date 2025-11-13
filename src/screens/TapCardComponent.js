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
  Stack,
} from "@mui/material";
import { Lock, Payment } from "@mui/icons-material";
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
  const { token } = useAuth();
  const { t } = useTranslation();
  const navigate=useNavigate()

  const orderIdDecoded = atob(decodeURIComponent(orderId));
  const amountDecoded = atob(decodeURIComponent(amount));
  const customerIdDecoded = atob(decodeURIComponent(customerId));
  const orderTypeDecoded = atob(decodeURIComponent(orderType));
  const TAP_PUIBLIC_KEY = process.env.REACT_APP_PAYMENT_TAP_PUBLIC_KEY;
   const TAP_MERCHANT_ID = process.env.REACT_APP_TAP_MERCHANT_ID
  // Fetch customer details
  useEffect(() => {
    const fetchCustomerDetails = async () => {
      try {
        const token = localStorage.getItem("token");
        const { data } = await api.get(
          `/get_customer_details?customerId=${customerIdDecoded}`,
          { headers: { Authorization: `Bearer ${token}` } }
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
          { headers: { Authorization: `Bearer ${token}` } }
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
          merchant: {id:TAP_MERCHANT_ID},//{ id: "67979587" },
          transaction: { amount: parseFloat(amountDecoded), currency: Currencies.SAR },
          customer: {
            id: CustomerDetails?.tap_cust_id || "",
            name: [{ lang: Locale.EN, first: CustomerDetails?.company_name_en }],
            editable: true,
            contact: { email: CustomerDetails?.contact_email, phone },
          },
          acceptance: { supportedBrands: ["MADA", "VISA", "MASTERCARD"], supportedCards: "ALL" },
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
    if (data?.status?.toLowerCase() === "error" && data?.details?.errors?.length > 0) {
      const errorMessage = data.details.errors
        .map((err) => `${err.code} - ${err.description}`)
        .join("\n");

      Swal.fire({
        icon: "error",
        title: "Payment Error",
        text: errorMessage || "Something went wrong during payment.",
        confirmButtonColor: "#0b4c45",
      });

      return; 
    }
    if (data?.data?.url) {
      const paymentUrl = data.data.url;
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

      if (isMobile) {
        navigate("/orders");
        window.open(paymentUrl, "_blank", "noopener,noreferrer");
      } else {
        window.location.replace(paymentUrl);
      }
    }
  } catch (error) {
       if (error.response?.data?.status?.toLowerCase() === "error" && error.response?.data?.details?.errors?.length > 0) {
      const errorMessage = error.response.data.details.errors
        .map((err) => `${err.code} - ${err.description}`)
        .join("\n");

      Swal.fire({
        icon: "error",
        title: "Payment Error",
        text: errorMessage || "Something went wrong during payment.",
        confirmButtonColor: "#0b4c45",
      });

      return; 
    }
    console.error("Failed to create charge request", error);
  } finally {
    setIsProcessing(false);
    setPaymentProcessing(false);
  }
};


  return (
    // <div
    //   style={{
    //     padding: "35px 28px",
    //     maxWidth: "500px",
    //     margin: "60px auto",
    //     backgroundColor: "#ffffff",
    //     borderRadius: "16px",
    //     boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
    //     fontFamily: "'Inter', sans-serif",
    //   }}
    // >
    //   <h2 style={{ textAlign: "center", color: "#0b4c45", fontWeight: 700 }}>
    //     {t("Secure Payment")}
    //   </h2>
    //   <p style={{ textAlign: "center", fontSize: "18px", marginBottom: "25px" }}>
    //     {t("Amount to Pay")}:{" "}
    //     <strong style={{ color: "#0b4c45" }}>{amountDecoded} SAR</strong>
    //   </p>

    //   {/* Saved Cards */}
    //   {!initialized && sdkLoaded && (
    //     <div
    //       style={{
    //         background: "#fafafa",
    //         border: "1px solid #e5e7eb",
    //         borderRadius: "12px",
    //         padding: "20px",
    //         marginBottom: "25px",
    //       }}
    //     >
    //       {CardDetails?.length > 0 && !selectedCardId ? (
    //         <>
    //           <h4 style={{ marginBottom: "15px", color: "#333" }}>
    //             {t("Select a saved card")}
    //           </h4>
    //           <div
    //             style={{
    //               maxHeight: "180px",
    //               overflowY: "auto",
    //               marginBottom: "20px",
    //             }}
    //           >
    //             {CardDetails.map((card) => (
    //               <label
    //                 key={card.id}
    //                 style={{
    //                   display: "block",
    //                   padding: "14px",
    //                   borderRadius: "10px",
    //                   border:
    //                     selectedCardId === card.id
    //                       ? "2px solid #0b4c45"
    //                       : "1px solid #ddd",
    //                   marginBottom: "10px",
    //                   backgroundColor:
    //                     selectedCardId === card.id ? "#e7f8f6" : "#fff",
    //                   cursor: "pointer",
    //                   transition: "0.2s",
    //                 }}
    //               >
    //                 <input
    //                   type="radio"
    //                   name="selectedCard"
    //                   value={card.id}
    //                   checked={selectedCardId === card.id}
    //                   onChange={() => handleCardSelection(card.id)}
    //                   style={{ marginRight: "10px" }}
    //                 />
    //                 💳 <strong>{card.brand}</strong> •••• {card.last_four} —{" "}
    //                 {card.name} ({card.exp_month}/{card.exp_year})
    //               </label>
    //             ))}
    //           </div>
    //           <button
    //             onClick={() => {
    //               setisCardselected(false);
    //               setCardDetails(null);
    //               initializeTapCard();
    //             }}
    //             style={{
    //               backgroundColor: "#0b4c45",
    //               color: "#fff",
    //               padding: "12px 24px",
    //               border: "none",
    //               borderRadius: "8px",
    //               fontWeight: "600",
    //               cursor: "pointer",
    //               width: "100%",
    //             }}
    //           >
    //             + {t("Add New Card")}
    //           </button>
    //         </>
    //       ) : (
    //         <div style={{ textAlign: "center", color: "#666" }}>
    //           {t("Preparing your payment form...")}
    //         </div>
    //       )}
    //     </div>
    //   )}

    //   {/* Card SDK container */}
    //   <div
    //     id="card-sdk-container"
    //     style={{
    //       marginBottom: "25px",
    //       border: "1px solid #e0e0e0",
    //       borderRadius: "10px",
    //       padding: "20px",
    //       backgroundColor: "#fafafa",
    //       display: initialized && !paymentProcessing ? "block" : "none",
    //     }}
    //   />

    //   {/* Payment progress */}
    //   {paymentProcessing && (
    //     <div
    //       style={{
    //         border: "1px solid #eee",
    //         borderRadius: "10px",
    //         backgroundColor: "#f5f5f5",
    //         textAlign: "center",
    //         padding: "20px",
    //         color: "#6c757d",
    //         marginBottom: "20px",
    //       }}
    //     >
    //       {t("Processing your payment...")}
    //     </div>
    //   )}

    //   {/* Pay Button */}
    //   {isPayButtonValid && (
    //     <button
    //       onClick={createToken}
    //       disabled={isProcessing || !initialized}
    //       style={{
    //         backgroundColor: isProcessing ? "#94a3b8" : "#0b4c45",
    //         color: "#fff",
    //         border: "none",
    //         padding: "14px 28px",
    //         borderRadius: "10px",
    //         fontSize: "16px",
    //         fontWeight: "600",
    //         cursor: isProcessing ? "not-allowed" : "pointer",
    //         width: "100%",
    //         transition: "0.3s ease",
    //       }}
    //     >
    //       {isProcessing ? t("Processing...") : t("Confirm Payment")}
    //     </button>
    //   )}

    //   {!sdkLoaded && (
    //     <p style={{ textAlign: "center", color: "#999", marginTop: "20px" }}>
    //       {t("Loading payment gateway...")}
    //     </p>
    //   )}
    // </div>
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
        maxWidth: 850,
        width: "100%",
        borderRadius: 4,
        boxShadow: 6,
        transition: "0.3s ease",
        "&:hover": { boxShadow: 10 },
      }}
    >
      {/* Header */}
      <CardHeader
        title={
          <Box display="flex" alignItems="center" justifyContent="center" gap={1}>
            <Payment color="primary" />
            <Typography variant="h5" fontWeight={700}>
              {t("Secure Card Payment")}
            </Typography>
          </Box>
        }
        subheader={t("Pay securely using your saved or new card")}
        sx={{ textAlign: "center", pb: 0 }}
      />
      <Divider sx={{ my: 2 }} />

      <CardContent>
        {/* Amount */}
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
                            {CustomerDetails?.company_name_en || "N/A"}
                          </Typography>
                          <Typography>
                            <strong>Phone:</strong>{" "}
                            {CustomerDetails?.contact_phone || "Not available"}
                          </Typography>
                          <Typography>
                            <strong>Email:</strong>{" "}
                            {CustomerDetails?.contact_email || "Not available"}
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid>
                         {/* Saved Cards Section */}
        {!initialized && sdkLoaded && (
          <Box
            sx={{
              background: "#fafafa",
              border: "1px solid #e0e0e0",
              borderRadius: 3,
              p: 3,
              mb: 4,
            }}
          >
            {CardDetails?.length > 0 && !selectedCardId ? (
              <>
                <Typography variant="subtitle1" fontWeight={600} mb={2}>
                  {t("Select a saved card")}
                </Typography>

                <Box sx={{ maxHeight: 200, overflowY: "auto", mb: 2 }}>
                  {CardDetails.map((card) => (
                    <Box
                      key={card.id}
                      onClick={() => handleCardSelection(card.id)}
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        p: 2,
                        borderRadius: 2,
                        border:
                          selectedCardId === card.id
                            ? "2px solid #0b4c45"
                            : "1px solid #ddd",
                        backgroundColor:
                          selectedCardId === card.id ? "#e7f8f6" : "#fff",
                        mb: 1.5,
                        cursor: "pointer",
                        transition: "0.2s",
                        "&:hover": { backgroundColor: "#f9f9f9" },
                      }}
                    >
                      <Typography>
                        💳 <strong>{card.brand}</strong> •••• {card.last_four} —{" "}
                        {card.name} ({card.exp_month}/{card.exp_year})
                      </Typography>
                    </Box>
                  ))}
                </Box>

                <button
                  onClick={() => {
                    setisCardselected(false);
                    setCardDetails(null);
                    initializeTapCard();
                  }}
                  style={{
                    backgroundColor: "#0b4c45",
                    color: "#fff",
                    padding: "12px 24px",
                    border: "none",
                    borderRadius: "8px",
                    fontWeight: "600",
                    cursor: "pointer",
                    width: "100%",
                  }}
                >
                  + {t("Add New Card")}
                </button>
              </>
            ) : (
              <Typography textAlign="center" color="text.secondary">
                {t("Preparing your payment form...")}
              </Typography>
            )}
          </Box>
        )}

        {/* Card SDK container */}
        <div
          id="card-sdk-container"
          style={{
            marginBottom: "25px",
            border: "1px solid #e0e0e0",
            borderRadius: "10px",
            padding: "20px",
            backgroundColor: "#fafafa",
            display: initialized && !paymentProcessing ? "block" : "none",
          }}
        />

        {/* Processing State */}
        {paymentProcessing && (
          <Box
            sx={{
              border: "1px solid #eee",
              borderRadius: 3,
              backgroundColor: "#f5f5f5",
              textAlign: "center",
              py: 3,
              mb: 3,
              color: "#6c757d",
            }}
          >
            {t("Processing your payment...")}
          </Box>
        )}

        {/* Pay Button */}
        {isPayButtonValid && (
          <button
            onClick={createToken}
            disabled={isProcessing || !initialized}
            style={{
              backgroundColor: isProcessing ? "#94a3b8" : "#0b4c45",
              color: "#fff",
              border: "none",
              padding: "14px 28px",
              borderRadius: "10px",
              fontSize: "16px",
              fontWeight: "600",
              cursor: isProcessing ? "not-allowed" : "pointer",
              width: "100%",
              transition: "0.3s ease",
            }}
          >
            {isProcessing ? t("Processing...") : t("Confirm Payment")}
          </button>
        )}

        {!sdkLoaded && (
          <Typography textAlign="center" color="text.secondary" mt={2}>
            {t("Loading payment gateway...")}
          </Typography>
        )}
                      </Grid>
      
                    </Grid>

       

        {/* Supported Cards */}
         <Divider sx={{ mt: 4, mb: 2 }} />
                  <Box textAlign="center">
                   
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mt: 1 }}
                    >
                      Your payment is secure and encrypted   <Lock sx={{ verticalAlign: "middle", color: "success.main" }} />
                    </Typography>
                    <Chip
                      label="Supported: MADA, Visa, Mastercard"
                      // variant="outlined"
                      color="primary"
                      sx={{ mt: 1 }}
                    />
                  </Box> 
      </CardContent>
    </Card>
  </Box>
  );
};

export default TapCardPayment;
