import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Swal from "sweetalert2";
import { useTranslation } from "react-i18next";
import api from "../utilities/api";
import { parsePhoneNumberFromString } from "libphonenumber-js";

const ApplePayComponent = () => {
  const [sdkLoaded, setSdkLoaded] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const { orderId, amount, customerId, orderType } = useParams();
  const [customerDetails, setCustomerDetails] = useState(null);
  const { token } = useAuth();
  const { t } = useTranslation();

  const orderIdDecoded = atob(decodeURIComponent(orderId));
  const amountDecoded = atob(decodeURIComponent(amount));
  const customerIdDecoded = atob(decodeURIComponent(customerId));
  const orderTypeDecoded = atob(decodeURIComponent(orderType));
  const TAP_PUBLIC_KEY = process.env.REACT_APP_PAYMENT_TAP_PUBLIC_KEY;
  const TAP_MERCHANT_ID = process.env.REACT_APP_TAP_MERCHANT_ID;

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

  // Initialize Apple Pay button
  useEffect(() => {
    if (!sdkLoaded || !customerDetails || initialized) return;
  if (!(window.ApplePaySession && window.ApplePaySession.canMakePayments())) {
    console.warn("Apple Pay not supported in this environment");
    return; // ⛔ Prevent Tap SDK render on unsupported browsers
  }
    const { render, ThemeMode, SupportedNetworks, Scope, Environment, Locale, ButtonType, Edges } =
      window.TapApplepaySDK;

    try {
      render(
        {
          publicKey: TAP_PUBLIC_KEY,
          // environment: Environment.D,
          environment: Environment.Development,
          scope: Scope.TapToken,
          merchant: {
            id: TAP_MERCHANT_ID,
            domain:"https://thankful-stone-03a740310-preview.centralus.1.azurestaticapps.net",
          },
          transaction: {
            currency: "SAR",
            amount: amountDecoded,
          },
         acceptance: {
  supportedBrands: [
    "MADA",
    "VISA",
    "MASTERCARD"
  ],
  supportedCardsWithAuthentications: ["3DS"]
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
          onCancel: () => console.log("Apple Pay cancelled"),
          onError: (error) => console.error("Apple Pay error:", error),
          onSuccess: (data) => handleSuccess(data),
          onReady: () => setInitialized(true),
        },
        "apple-pay-button"
      );
    } catch (error) {
      console.error("Error initializing Apple Pay:", error);
    }
  }, [sdkLoaded, customerDetails, initialized, TAP_PUBLIC_KEY, TAP_MERCHANT_ID, amountDecoded]);

  const handleSuccess = async (paymentData) => {
    console.log("paymentData",paymentData)
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
      if (data?.data?.url) window.location.replace(data.data.url);
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
    <div
      style={{
        padding: "35px 28px",
        maxWidth: "500px",
        margin: "60px auto",
        backgroundColor: "#ffffff",
        borderRadius: "16px",
        boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
        fontFamily: "'Inter', sans-serif",
      }}
    >
      <h2 style={{ textAlign: "center", color: "#0b4c45", fontWeight: 700 }}>
         
        {t("Secure Payment")} {sdkLoaded}
      </h2>
      <p style={{ textAlign: "center", fontSize: "18px", marginBottom: "25px" }}>
        {t("Amount to Pay")}:{" "}
        <strong style={{ color: "#0b4c45" }}>{amountDecoded} SAR</strong>
      </p>

      {!sdkLoaded && (
        <p style={{ textAlign: "center", color: "#999" }}>
          {t("Loading payment gateway...")}
        </p>
      )}

      <div
        id="apple-pay-button"
        style={{
          display: sdkLoaded ? "block" : "none",
          minHeight: "60px",
          textAlign: "center",
        }}
      />

      {isProcessing && (
        <div
          style={{
            marginTop: "20px",
            border: "1px solid #eee",
            borderRadius: "10px",
            backgroundColor: "#f5f5f5",
            textAlign: "center",
            padding: "20px",
            color: "#6c757d",
          }}
        >
          {t("Processing your payment...")}
        </div>
      )}
    </div>
  );
};

export default ApplePayComponent;
