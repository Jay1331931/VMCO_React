import axios from "axios";
import React, { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Swal from "sweetalert2";
import { useTranslation } from "react-i18next";
import api from "../utilities/api";
import { parsePhoneNumberFromString } from "libphonenumber-js";

const TapCardPayment = () => {
  const [sdkLoaded, setSdkLoaded] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const { orderId, amount, customerId } = useParams();
  const [CustomerDetails, setCustomerDetails] = useState(null);
  const [CardDetails, setCardDetails] = useState(null);
  const [selectedCardId, setSelectedCardId] = useState(null);
  const [isCardselected,setisCardselected]=useState(false)
  const [isPayButtonValid,setisPayButtonValid]=useState(false)
  const { token, user } = useAuth();
  const { t } = useTranslation();

  const orderIdDecoded = atob(decodeURIComponent(orderId));
  const amountDecoded = atob(decodeURIComponent(amount));
  const customerIdDecoded = atob(decodeURIComponent(customerId));
  const TAP_PUIBLIC_KEY = process.env.REACT_APP_PAYMENT_TAP_PUBLIC_KEY;
  useEffect(() => {
    const fetchCustomerDetails = async () => {
      try {
        const token = localStorage.getItem("token"); // always use latest
        const { data } = await api.get(
          `/get_customer_details?customerId=${customerIdDecoded}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        setCustomerDetails(data?.details);
      } catch (error) {
        console.error("Failed to fetch Customer details", error);
      }
    };

    if (customerIdDecoded) {
      fetchCustomerDetails();
    }
  }, [customerIdDecoded]); // dependency array ensures it runs when customerIdDecoded changes
  useEffect(() => {
    const fetchCardDetails = async () => {
      try {
        const { data } = await api.get(
          `get_card_detrails?TapCustId=${CustomerDetails?.tap_cust_id}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (data.details?.length > 0 && data.success) {
          setCardDetails(data.details);
          setisCardselected(true)
          // initializeTapCard()
        } else {
          setisCardselected(false)
          initializeTapCard();
        }
      } catch (error) {
        console.error("Failed to fetch Card details", error);
      }
    };
    if (CustomerDetails?.tap_cust_id) {
      fetchCardDetails();
    }else{
       initializeTapCard();
    }
  }, [CustomerDetails]);
  useEffect(() => {
    // Check if script is already loaded
    if (window.CardSDK) {
      setSdkLoaded(true);
      return;
    }

    // Load the Tap Card SDK script
    const script = document.createElement("script");
    script.src = "https://tap-sdks.b-cdn.net/card/1.0.2/index.js";
    script.async = true;
    script.onload = () => {
      setSdkLoaded(true);
    };
    script.onerror = () => {
      console.error("Failed to load Tap Card SDK");
    };

    document.head.appendChild(script);

    return () => {
      // Don't try to clean up the SDK as it causes errors
    };
  }, []);

  // useEffect(() => {
  //   if (sdkLoaded && !initialized) {
  //     // Small delay to ensure DOM is ready
  //     setTimeout(initializeTapCard, 100);
  //   }
  // }, [sdkLoaded, initialized]);

  // useEffect(()=>{
  //   if(paymentProcessing)
  //   {
  //     setInitialized(true)
  //   }
  // },[paymentProcessing])
  let customerPhone;
  if (CustomerDetails?.contact_phone) {
    customerPhone = parsePhoneNumberFromString(CustomerDetails?.contact_phone);
  }

  let phone;
  if (customerPhone && customerPhone.isValid()) {
    phone = {
      countryCode: customerPhone.countryCallingCode, // e.g., '966'
      number: customerPhone.nationalNumber, // e.g., '501234581'
    };
  }
  const handleCardSelection = (id) => {
    setSelectedCardId(id);
    setisCardselected(false)
    initializeTapCard(id);
    console.log("Selected card ID:", id);
    // You can now send this id when creating the charge request
  };
  const initializeTapCard = (selectedCard = null) => {
    if (window.CardSDK && !initialized) {
      //   const { renderTapCard, Theme, Currencies, Direction, Edges, Locale } = window.CardSDK;
      const {
        renderTapCard,
        Theme,
        Currencies,
        Direction,
        Edges,
        Locale,
        updateCardConfiguration,
        loadSavedCard,
      } = window.CardSDK;
      try {
        // Make sure the container exists
        const container = document.getElementById("card-sdk-container");
        if (!container) {
          Swal.fire({
            title: t("Error"),
            text: t("Container not found"),
            icon: "error",
            confirmButtonText: t("OK"),
          });
          return;
          // console.error('Container not found');
        }

        // Clear any existing content
        container.innerHTML = "";

        // Create the element that the SDK expects
        const sdkElement = document.createElement("div");
        sdkElement.id = "card-sdk-id";
        container.appendChild(sdkElement);

        // Initialize the SDK
        renderTapCard("card-sdk-id", {
          publicKey: TAP_PUIBLIC_KEY, // Replace with your actual key
          merchant: {
            id: process.env.REACT_APP_TAP_MERCHANT_ID,
          },
          transaction: {
            amount: parseFloat(amountDecoded),
            currency: Currencies.SAR,
          },
          customer: {
            id: CustomerDetails?.tap_cust_id
              ? CustomerDetails?.tap_cust_id
              : "", //'cus_TS06A4420250631e6HP0809471',
            name: [
              {
                lang: Locale.EN,
                first: CustomerDetails?.company_name_en,
                // last: 'Test',
                // middle: 'Test',
              },
            ],
            // nameOnCard: 'Test Test',
            editable: true,
            contact: {
              email: CustomerDetails?.contact_email,
              phone,
              // phone: {
              //   countryCode: '20',
              //   number: '1000000000',
              // },
            },
          },
          acceptance: {
            supportedBrands: ["MADA", "VISA", "MASTERCARD"],
            supportedCards: "ALL",
          },
          fields: {
            cardHolder: true,
          },
          addons: {
            displayPaymentBrands: true,
            loader: true,
            saveCard: true,
          },
          interface: {
            locale: Locale.EN,
            theme: Theme.LIGHT,
            edges: Edges.CURVED,
            direction: Direction.LTR,
          },
          onReady: () => {
            console.log("Tap Card SDK Ready", selectedCard);
            if (selectedCard) {
              loadSavedCard(selectedCard);
            }

            setInitialized(true);
          },
          onFocus: () => console.log("onFocus"),
          onBinIdentification: (data) =>
            console.log("onBinIdentification", data),
          onValidInput: (data) => {
            console.log("onValidInputChange", data);
            setIsProcessing(!data);
            setisPayButtonValid(data)
          },
          onInvalidInput: (data) => console.log("onInvalidInput", data),
          onChangeSaveCardLater: (isSaveCardSelected) =>
            console.log(isSaveCardSelected, " :onChangeSaveCardLater"),
          onError: (data) => {
            console.log("onError111111111111111", data);
            setIsProcessing(false);
          },
          onSuccess: (data) => {
            createChargeRequest(data);
          },
        });
      } catch (error) {
        console.error("Error initializing Tap Card:", error);
      }
    }
  };

  const createToken = () => {
    if (window.CardSDK && window.CardSDK.tokenize) {
      setPaymentProcessing(true);
      setIsProcessing(true);

      window.CardSDK.tokenize();
    } else {
      console.error("Tap Card SDK not loaded or tokenize method not available");
      // alert("Payment system not ready. Please try again.");
        Swal.fire({
            title: t("Error"),
            text: t("Payment system not ready. Please try again."),
            icon: "error",
            confirmButtonText: t("OK"),
          });
    }
    setisPayButtonValid(false)
  };

  const createChargeRequest = async (tokenDATA) => {
    try {
      const payload = {
        salesOrderId: orderIdDecoded,
        amount: amountDecoded,
        customerName: CustomerDetails?.company_name_en,
        tokenData: tokenDATA,
      };

      const { data } = await api.post(`/payment/generate-link`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      console.log("data.url", data);

      if (data?.data?.url) {
        window.location.replace(data.data.url);
      } else {
        console.error("Payment URL not found in response");
      }
    } catch (error) {
      console.error("Failed to create charge request", error);
    } finally {
      setIsProcessing(false);
      setPaymentProcessing(false);
    }
  };

  return (
    <div
      style={{
        padding: "20px",
        fontFamily: "Arial, sans-serif",
        maxWidth: "500px",
        margin: "0 auto",
      }}
    >
      <h2 style={{ color: "#333", textAlign: "center" }}>Payment Checkout</h2>

      <p
        style={{ fontSize: "18px", textAlign: "center", marginBottom: "20px" }}
      >
        Amount to Pay: <strong>{amountDecoded} SAR</strong>
      </p>
    

      <div
        id="card-sdk-container"
        style={{
          // minHeight: "250px",
          marginBottom: "20px",
          border: "1px solid #ddd",
          borderRadius: "8px",
          padding: "15px",
          backgroundColor: "#f9f9f9",
          display: initialized
            ? !paymentProcessing
              ? "block"
              : "none"
            : "none",
        }}
      />

      {!initialized && sdkLoaded  &&  (
        <div
          style={{
            // minHeight: "250px",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            marginBottom: "20px",
            border: "1px solid #ddd",
            borderRadius: "8px",
            padding: "15px",
            backgroundColor: "#f0f0f0",
          }}
        >
           {CardDetails?.length > 0 && !selectedCardId && (
  <div>
    <div
      style={{
        maxHeight: "150px",
        overflowY: "auto",
        marginBottom: "20px",
        border: "1px solid #ddd",
        borderRadius: "8px",
        padding: "10px",
        backgroundColor: "#f9f9f9",
      }}
    >
      {CardDetails.map((card) => (
        <label
          key={card.id}
          style={{
            display: "block",
            padding: "10px",
            marginBottom: "8px",
            borderRadius: "6px",
            border:
              selectedCardId === card.id
                ? "2px solid #0b4c45"
                : "1px solid #ccc",
            cursor: "pointer",
            backgroundColor:
              selectedCardId === card.id ? "#e6f7f5" : "#fff",
          }}
        >
          <input
            type="radio"
            name="selectedCard"
            value={card.id}
            checked={selectedCardId === card.id}
            onChange={() => handleCardSelection(card.id)}
            style={{ marginRight: "10px" }}
          />
          <strong>{card.brand}</strong> •••• {card.last_four} — {card.name} (Exp: {card.exp_month}/{card.exp_year})
        </label>
      ))}
    </div>

    <div style={{ textAlign: "center", marginBottom: "20px" }}>
      <button
        onClick={()=>{
          setisCardselected(false)
          setCardDetails(null)
          initializeTapCard()}}
        style={{
          padding: "10px 20px",
          backgroundColor: "#0b4c45",
          color: "white",
          border: "none",
          borderRadius: "6px",
          cursor: "pointer",
          fontSize: "16px",
          fontWeight: "bold",
        }}
      >
        New Card
      </button>
    </div>
  </div>
)}

         {!isCardselected  && <div style={{ textAlign: "center", color: "#6c757d" }}>
            Setting up your payment form...
          </div>}
        </div>
      )}

      {paymentProcessing ? (
        <div
          style={{
            // minHeight: "250px",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            marginBottom: "20px",
            border: "1px solid #ddd",
            borderRadius: "8px",
            padding: "15px",
            backgroundColor: "#f0f0f0",
          }}
        >
          <div style={{ textAlign: "center", color: "#6c757d" }}>
            Processing your payment...
          </div>
        </div>
      ) : null}

      {isPayButtonValid &&<div style={{ textAlign: "center", marginBottom: "15px" }}>
        <button
          onClick={createToken}
          disabled={isProcessing || !initialized}
          style={{
            padding: "12px 24px",
            backgroundColor:
              isProcessing || !initialized ? "#6c757d" : "#0b4c45",
            color: "white",
            border: "none",
            borderRadius: "6px",
            cursor: isProcessing || !initialized ? "not-allowed" : "pointer",
            fontSize: "16px",
            fontWeight: "bold",
            width: "200px",
            marginRight: "10px",
          }}
        >
       Confirm Payment
        </button>
      </div>}

      {!sdkLoaded && (
        <div
          style={{
            textAlign: "center",
            color: "#6c757d",
            marginTop: "20px",
            fontSize: "14px",
          }}
        >
          Loading payment gateway...
        </div>
      )}
    </div>
  );
};

export default TapCardPayment;
