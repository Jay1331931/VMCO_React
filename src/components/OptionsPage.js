import React, { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Constants from "../constants";
import Swal from "sweetalert2";
import axios from "axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBuilding,
  faCreditCard,
  faMobile,
} from "@fortawesome/free-solid-svg-icons";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import api from "../utilities/api";
import Sidebar from "./Sidebar";
import { t } from "i18next";
import { Box, Button, Card, Stack } from "@mui/material";
import CreditCardIcon from "@mui/icons-material/CreditCard";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import AppleIcon from "@mui/icons-material/Apple";
import LoadingSpiner from "./LoadingSpinner"
import { useTranslation } from "react-i18next";
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;
const getCookie = (name) => {
  return localStorage.getItem(name);
};
const OptionsPage = () => {
  const [OrderDetails, setOrderDetails] = useState([]);
  const [TempOrderDetails, setTempOrderDetails] = useState([]);
  const { orderId, orderType } = useParams();
  const [decodedOrderID, setDecodedOrderID] = useState(null);
  const [tempdecodedOrderID, setTempDecodedOrderID] = useState(null);
  const [DecodedorderTpe, setDecodedOrderType] = useState(null);
  const [amount, setAmount] = useState(0);
const {t} = useTranslation();
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const cookieToken = getCookie("token");
  console.log("user", user);

  console.log("orderType", orderType);
  const fetchDecodeddata = useCallback(async () => {
    try {
      const token = localStorage.getItem("token"); // always use latest
      const { data } = await api.get(
        `/decode-ids?encryptedorderIds=${orderId}&salesOrderType=${orderType}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (data?.details?.orderType?.toLowerCase() === "cart") {
        setDecodedOrderType(data?.details?.orderType);
        setTempDecodedOrderID(data?.details?.orderIds);
      } else {
        setDecodedOrderID(data?.details?.orderIds);
        setDecodedOrderType(data?.details?.orderType);
      }
    } catch (error) {
      console.error("Failed to fetch decoded data", error);
    }
  }, [orderId]);

  const fetchSaleOrder = useCallback(async () => {
    try {
      if (!decodedOrderID) return;

      const token = localStorage.getItem("token"); // always use latest
      const ids = decodedOrderID.toString().split(",");
      console.log("Decoded Order ID(s):", ids);

      const results = await Promise.all(
        ids.map((id) =>
          api.get(`/sales-order/id/${parseInt(id)}`, {
            headers: { Authorization: `Bearer ${token}` },
          })
        )
      );

      const allOrders = results.map((res) => res.data.data);
      setOrderDetails(allOrders);
      console.log("Sale Order Data:", allOrders);
    } catch (error) {
      console.error("Failed to fetch sale order", error);
    }
  }, [decodedOrderID]);
  const fetchtempSaleOrder = useCallback(async () => {
    try {
      if (!tempdecodedOrderID) return;

      const token = localStorage.getItem("token"); // always use latest
      const ids = tempdecodedOrderID.toString().split(",");
      console.log("Decoded Order ID(s):", ids);

      const results = await Promise.all(
        ids.map((id) =>
          api.get(`/temp-sales-order/id/${id}`, {
            headers: { Authorization: `Bearer ${token}` },
          })
        )
      );

      const allOrders = results.map((res) => res.data.data);
      setTempOrderDetails(allOrders);
      console.log("Sale Order Data:", allOrders);
    } catch (error) {
      console.error("Failed to fetch sale order", error);
    }
  }, [tempdecodedOrderID]);

  useEffect(() => {
    fetchDecodeddata();
  }, [fetchDecodeddata]);

  useEffect(() => {
    if (decodedOrderID) {
      fetchSaleOrder();
    }
  }, [decodedOrderID, fetchSaleOrder]);

  useEffect(() => {
    if (tempdecodedOrderID) {
      fetchtempSaleOrder();
    }
  }, [tempdecodedOrderID, fetchtempSaleOrder]);

  useEffect(() => {
    console.log("OrderDetails:", TempOrderDetails);
    if (!TempOrderDetails || TempOrderDetails.length === 0) return;

    // Sum all order totals and paid amounts
    const totalAmount = TempOrderDetails.reduce(
      (sum, order) => sum + (parseFloat(order.totalAmount) || 0),
      0
    );
    setAmount(parseFloat(totalAmount));
    console.log("Amount match:", 0 == null, totalAmount);
  }, [TempOrderDetails]);
  useEffect(() => {
    console.log("OrderDetails:", OrderDetails);
    if (!OrderDetails || OrderDetails.length === 0) return;

    // Sum all order totals and paid amounts
    const totalAmount = OrderDetails.reduce(
      (sum, order) => sum + (parseFloat(order.totalAmount) || 0),
      0
    );
    const paidAmount = OrderDetails.reduce(
      (sum, order) => sum + (parseFloat(order.paidAmount) || 0),
      0
    );

    const allPaid = OrderDetails.every(
      (order) =>
        order.paymentStatus?.toLowerCase() === "paid" &&
        Math.floor(Number(order.paidAmount)) >=
          Math.floor(Number(order.totalAmount))
    );

    // Check if all orders have 100% payment config and none are paid yet
    const allZeroPaidAndFullPayment = OrderDetails.every(
      (order) =>
        Math.floor(Number(order.paidPercentage || 0)) === 0 &&
        Math.floor(Number(order.paymentPercentage || 0)) === 100 &&
        order.paymentStatus?.toLowerCase() !== "paid"
    );

    // Check if entity is VMCO and all orders are unpaid and paymentPercentage = 30
    const allUnpaidVMCO = OrderDetails.every(
      (order) =>
        (Number(order.paidAmount) === 0 || order.paidAmount == null) &&
        Math.floor(Number(order.paymentPercentage || 0)) === 30 &&
        order.entity?.toLowerCase() === Constants.ENTITY?.VMCO?.toLowerCase()
    );

    console.log("Amount match:", 0 == null);
    // Mixed condition: paid partially and paymentPercentage is 30 and 70% amount is not paid
    const somePaid30 = OrderDetails.every(
      (order) =>
        (Number(order.paidAmount || 0) > 0 || order.paidAmount == null) &&
        Math.floor(Number(order.paymentPercentage || 0)) === 30
    );
    const paidOrders = OrderDetails.filter(
      (order) =>
        order.paymentStatus?.toLowerCase() === "paid" &&
        Math.floor(Number(order.paidAmount)) >=
          Math.floor(Number(order.totalAmount))
    );

    if (paidOrders.length > 0) {
      const paidIds = paidOrders.map((order) => order.id).join(", ");
      Swal.fire({
        title: t("Payment Already Done"),
        text: `The following sales order(s) are already paid: ${paidIds}`,
        icon: "info",
        confirmButtonText: t("OK"),
      }).then(() => window.close());
      return;
    } else if (allPaid) {
      Swal.fire({
        title: t("Payment Already Done"),
        text: t("All selected orders have already been paid."),
        icon: "info",
        confirmButtonText: t("OK"),
      }).then(() => window.close());
      return;
    } else if (allZeroPaidAndFullPayment) {
      setAmount(totalAmount);
    } else if (allUnpaidVMCO) {
      setAmount((30 / 100) * totalAmount);
    } else if (somePaid30) {
      setAmount(totalAmount - paidAmount);
    } else {
      Swal.fire({
        title: t("Payment Amount Error"),
        text: t("Could not process the payment amount for all orders."),
        icon: "error",
        confirmButtonText: t("OK"),
      }).then(() => window.close());
      return;
    }
  }, [OrderDetails]);

  const handleBankTransaction = async (amount, decodedOrderID) => {
    try {
      const { data } = await api.post(
        `/generatePayment-link`,
        {
          id: decodedOrderID,
          endPoint: "bankTransactions/order",
          amount: amount,
        },
        {
          headers: { Authorization: `Bearer ${cookieToken}` },
        }
      );

      console.log("Payment link generated:", data);

      if (!data || !data.details) {
        Swal.fire({
          title: t("Error"),
          text: t("Failed to generate payment link."),
          icon: "error",
          confirmButtonText: t("OK"),
        }).then(() => {
          window.close();
        });
        return;
      }

      // window.location.replace(data.details.url);
      const extracted = data?.details?.url?.split('/bankTransactions')[1] 
                navigate(`/bankTransactions${extracted}`)
      // navigate(/)
      // window.close();
    } catch (error) {
      console.error("Error generating bank transaction link:", error);

      if (error?.response?.status === 401) {
        Swal.fire({
          title: t("Session Expired"),
          text: t("Please refresh the page to continue."),
          icon: "info",
          showCancelButton: true,
          confirmButtonText: t("Reload Page"),
          cancelButtonText: t("Close"),
        }).then(async (result) => {
          if (result.isConfirmed) {
          } else if (result.dismiss === Swal.DismissReason.cancel) {
            window.close();
          }
        });
      } else {
        Swal.fire({
          title: t("Error"),
          text: t("Something went wrong. Please try again later."),
          icon: "error",
          confirmButtonText: t("OK"),
        }).then(() => {
          window.close(); // Close the current window/tab after OK
        });
      }
    }
  };
  const handlePayment = async (paymentType) => {
    console.log("paymentType", amount);
    if (amount <= 0) {
      Swal.fire({
        title: t("Invalid Amount"),
        text: t("The amount must be greater than zero."),
        icon: "error",
        confirmButtonText: t("OK"),
      }).then(() => {
        window.close(); // Close the current window/tab after OK
      });
      return;
    }

    try {
      const orderIdEncoded =
        DecodedorderTpe?.toLowerCase() === "cart"
          ? encodeURIComponent(btoa(tempdecodedOrderID))
          : encodeURIComponent(btoa(decodedOrderID));
      const amountEncoded = encodeURIComponent(btoa(amount.toString()));
      // const emailEncoded = encodeURIComponent(btoa(CustomerDetails?.contact_email));
      // const companyEncoded = encodeURIComponent(btoa(OrderDetails[0]?.companyNameEn));
      const customerIdEncoded =
        DecodedorderTpe?.toLowerCase() === "cart"
          ? encodeURIComponent(
              btoa(TempOrderDetails[0]?.orderDetails?.customerId)
            )
          : encodeURIComponent(btoa(OrderDetails[0]?.customerId));
      const orderTypeEncoded =
        DecodedorderTpe?.toLowerCase() === "cart"
          ? encodeURIComponent(btoa(DecodedorderTpe))
          : encodeURIComponent(btoa("orders"));
      // const response = await makeRequest();

      let URL;
      if (paymentType?.toLowerCase() == "cardpay") {
      
        URL = `/tapcard/${orderIdEncoded}/${amountEncoded}/${customerIdEncoded}/${orderTypeEncoded}`;
      } else {
        URL = `/apple-pay/${orderIdEncoded}/${amountEncoded}/${customerIdEncoded}/${orderTypeEncoded}`;
      }
      // window.location.replace(URL);
      // window.close();
      navigate(URL)

    } catch (error) {
      console.error("Error generating payment link:", error);
      if (error.response && error.response.status === 401) {
        Swal.fire({
          title: t("Session Expired"),
          text: t("Please refresh the page to continue."),
          icon: "info",
          showCancelButton: true,
          confirmButtonText: t("Reload Page"),
          cancelButtonText: t("Close"),
        }).then(async (result) => {
          if (result.isConfirmed) {
            try {
              // await generateToken(); // Call your API to get new token
            } catch (error) {
              console.error("Token regeneration failed:", error);
              Swal.fire({
                title: t("Error"),
                text: t("Unable to refresh session. Please try again."),
                icon: "error",
              });
              window.close();
            }
          } else if (result.dismiss === Swal.DismissReason.cancel) {
            window.close(); // Close the tab
          }
        });
      } else {
        Swal.fire({
          title: t("Error"),
          text: t("Failed to generate payment link. Please try again later."),
          icon: "error",
          confirmButtonText: t("OK"),
        }).then(() => {
          window.close(); // Close the current window/tab after OK
        });
      }
    }
    // navigate(data?.data?.InvoiceURL)
  };
  const allowedEntities = Object.values({
    SHC: Constants.ENTITY?.SHC,
    GMTC: Constants.ENTITY?.GMTC,
    DAR: Constants.ENTITY?.DAR,
  }).map((e) => e?.toLowerCase());

  const currentEntity = TempOrderDetails?.[0]?.entity?.toLowerCase();
  const isMatch = allowedEntities.includes(currentEntity);
  console.log("currentEntity", isMatch, currentEntity);
  const isMobile = /iPhone|iPad|iPod/i.test(navigator.userAgent);
  const Mobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  const isDesktop = !Mobile;
  const isVMCO =
    OrderDetails[0]?.entity?.toLowerCase() ===
    Constants.ENTITY?.VMCO?.toLowerCase();

  const isNAQI =
    (OrderDetails[0]?.entity?.toLowerCase() ||
      TempOrderDetails[0]?.entity?.toLowerCase()) ===
    Constants.ENTITY?.NAQI?.toLowerCase();

  const showApplePay =
    OrderDetails[0]?.entity?.toLowerCase() ===
      Constants.ENTITY?.DAR?.toLowerCase() ||
    OrderDetails[0]?.entity?.toLowerCase() ===
      Constants.ENTITY?.GMTC?.toLowerCase() ||
    OrderDetails[0]?.entity?.toLowerCase() ===
      Constants.ENTITY?.SHC?.toLowerCase() ||
    isMatch;

  return (
    <Sidebar title={t("Payment Options")} >
      { (isVMCO || isNAQI || showApplePay  ) ?  <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "80vh",
          // backgroundColor: "#F3F4F6",
          p: 2,
        }}
      >
        <Card
          sx={{
            width: "100%",
            maxWidth: 400,
            p: 4,
            borderRadius: 3,
            boxShadow: "0px 4px 14px rgba(0,0,0,0.14)",
          }}
        >
          <Stack spacing={3}>
            {(isVMCO || isNAQI) && (
              <Button
                fullWidth
                variant="contained"
                startIcon={<AccountBalanceIcon />}
                sx={{
                  py: 2,
                  fontSize: "10px",
                  fontWeight: 600,
                  bgcolor: "#2563eb",
                  borderRadius: 2,
                  "&:hover": { bgcolor: "#1d4ed8" },
                }}
                onClick={() =>
                  handleBankTransaction(
                    amount,
                    DecodedorderTpe.toLowerCase() === "cart"
                      ? tempdecodedOrderID
                      : decodedOrderID
                  )
                }
              >
                {t("Bank Transaction")}
              </Button>
            )}

            <Button
              fullWidth
              variant="contained"
              startIcon={<CreditCardIcon />}
              sx={{
                py: 2,
                fontSize: "10px",
                fontWeight: 600,
                bgcolor: "#0293cc",
                borderRadius: 2,
                "&:hover": { bgcolor: "rgb(12, 170, 233)" },
              }}
              onClick={() => handlePayment("CardPay")}
            >
              {t("Cards Pay")}
            </Button>

            {showApplePay && (isMobile || isDesktop) && (
              <Button
                fullWidth
                variant="contained"
                startIcon={<AppleIcon />}
                sx={{
                  py: 2,
                  fontSize: "10px",
                  fontWeight: 600,
                  bgcolor: "#000",
                  color: "#fff",
                  borderRadius: 2,
                  "&:hover": { bgcolor: "#333" },
                }}
                onClick={() => handlePayment("Apple Pay")}
              >
                {t("Apple Pay")}
              </Button>
            )}
          </Stack>
        </Card>
      </Box>:<LoadingSpiner/>  }
     
    </Sidebar>
  );
};

export default OptionsPage;
