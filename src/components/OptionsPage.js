import React, { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Constants from "../constants";
import Swal from "sweetalert2";
import axios from "axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBuilding, faCreditCard, faMobile } from "@fortawesome/free-solid-svg-icons";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;
const getCookie = (name) => {
  // const cookies = document.cookie
  //   .split(";")
  //   .map(cookie => cookie.trim())
  //   .reduce((acc, cookie) => {
  //     const [key, ...rest] = cookie.split("=");
  //     acc[key] = decodeURIComponent(rest.join("="));
  //     return acc;
  //   }, {});
  // return cookies[name] || null;
  return localStorage.getItem(name);
};
const OptionsPage = () => {
  const [OrderDetails, setOrderDetails] = useState([]);
  const { orderId } = useParams();
  const [decodedOrderID, setDecodedOrderID] = useState(null);
  const [amount, setAmount] = useState(0);
  const { token } = useAuth();
  const navigate = useNavigate();

  // if (orderId &&!token ){
  //   try {
  //     const generateToken=async () => {

  //       const response = await axios.post(`${API_BASE_URL}/auth/temporary-token-generation`,{"role":"Guest","userId":0,"userName":"payment" });
  //       return response?.data?.details;
  //     }

  //   } catch (error) {
  //     console.error("Error generating token:", error);
  //   }

  // }
 const generateToken = async () => {
      try {
        const { data } = await axios.post(
          `${API_BASE_URL}/auth/temporary-token-generation`,
          {
            role: "Guest",
            userId: 0,
            userName: "payment",
          },
          {
            headers: { "Authorization": `Bearer ${token}` },
          }
        );
        console.log("Temporary Token Response:", data.details);
      } catch (error) {
        console.error("Error generating temporary token:", error);
      }
    };
  useEffect(() => {
     const cookieToken = getCookie("token");
   
    if (orderId && !cookieToken) {
      generateToken();
    } 
  }, [orderId, token]);
  const fetchDecodeddata = useCallback(async () => {
    try {
      const { data } = await axios.get(
        `${API_BASE_URL}/decode-ids?encryptedorderIds=${orderId}`,
        {
          headers: { "Authorization": `Bearer ${token}` },
        }
      );
      // setDecodedOrderID(parseInt(data?.details?.orderIds));
      setDecodedOrderID(data?.details?.orderIds);
    } catch (error) {
      console.error("Failed to fetch decoded data", error);
    }
  }, [orderId]);
  useEffect(() => {
    fetchDecodeddata();
  }, [fetchDecodeddata]);
  // const fetchSaleOrder = useCallback(async () => {
  //   try {
  //     if (!decodedOrderID) return;
  //    console.log("Decoded Order ID:", decodedOrderID);
  //     const { data } = await axios.get(
  //       `${API_BASE_URL}/sales-order/id/${decodedOrderID}`,
  //       {
  //        
  //       }
  //     );

  //     setOrderDetails(data.data);
  //     console.log("Sale Order Data:", data.data);
  //   } catch (error) {
  //     console.error("Failed to fetch sales order", error);
  //   }
  // }, [decodedOrderID]);

  const fetchSaleOrder = useCallback(async () => {
    try {
      if (!decodedOrderID) return;

      const ids = decodedOrderID.toString().split(",");
      console.log("Decoded Order ID(s):", ids);

      const results = await Promise.all(
        ids.map((id) =>
          axios.get(`${API_BASE_URL}/sales-order/id/${parseInt(id)}`, {
            headers: { "Authorization": `Bearer ${token}` },
          })
        )
      );

      const allOrders = results.map((res) => res.data.data);
      setOrderDetails(allOrders); // array of orders
      console.log("Sale Order Data:", allOrders);
    } catch (error) {
      console.error("Failed to fetch sales order", error);
    }
  }, [decodedOrderID]);

  useEffect(() => {
    if (decodedOrderID) {
      fetchSaleOrder();
    }
  }, [decodedOrderID, fetchSaleOrder]);
  //   useEffect(() => {
  //     console.log("OrderDetails:", OrderDetails);
  //   if (!OrderDetails || OrderDetails.length === 0) return;

  //   const totalAmount = OrderDetails.reduce(
  //     (sum, order) => sum + (parseFloat(order.totalAmount) || 0),
  //     0
  //   );
  //   const paidAmount = OrderDetails?.reduce(
  //     (sum, order) => sum + (parseFloat(order.paidAmount) || 0),
  //     0
  //   );
  //   const paidPercentage = (paidAmount / totalAmount) * 100;

  //   const firstOrder = OrderDetails[0];
  //   const paymentPercentage = parseFloat(firstOrder.paymentPercentage) || 0;
  //   const entity = firstOrder?.entity?.toLowerCase();
  //   const paymentStatus = firstOrder?.paymentStatus?.toLowerCase();

  //   console.log("Total:", totalAmount, "Paid:", paidAmount, "Percentage:", paidPercentage);

  //   if (paymentStatus === "paid" && paidAmount >= totalAmount) {
  //     Swal.fire({
  //       title: "Payment Already Done",
  //       text: "This order has already been paid.",
  //       icon: "info",
  //       confirmButtonText: "OK",
  //     }).then(() => {
  //   window.close(); // Close the current window/tab after OK
  // });
  //     window.close();
  //     return;
  //   } else if (paidPercentage === 0 && paymentPercentage === 100) {
  //     setAmount(totalAmount);
  //   } else if (
  //     paidAmount === 0 &&
  //     paymentPercentage === 30 &&
  //     entity === Constants.ENTITY?.VMCO?.toLowerCase()
  //   ) {
  //     setAmount((paymentPercentage / 100) * totalAmount);
  //   } else if (paidAmount > 0 && paymentPercentage === 30) {
  //     setAmount(totalAmount - paidAmount);
  //   } else {
  //     Swal.fire({
  //       title: "Payment Amount Error",
  //       text: "Could not process the payment amount.",
  //       icon: "error",
  //       confirmButtonText: "OK",
  //     }).then(() => {
  //   window.close(); // Close the current window/tab after OK
  // });
  //     return;
  //   }
  // }, [OrderDetails]);
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

    // Check if all orders are fully paid
    const allPaid = OrderDetails.every(
      (order) =>
        order.paymentStatus?.toLowerCase() === "paid" &&
        parseFloat(order.paidAmount) >= parseFloat(order.totalAmount)
    );

    // Check if all orders have 100% payment config and none are paid yet
    const allZeroPaidAndFullPayment = OrderDetails.every(
      (order) =>
        parseFloat(order.paidPercentage || 0) === 0 &&
        parseFloat(order.paymentPercentage || 0) === 100 &&
        order.paymentStatus?.toLowerCase() !== "paid"
    );

    // Check if entity is VMCO and all orders are unpaid and paymentPercentage = 30
    const allUnpaidVMCO = OrderDetails.every(
      (order) =>
        (parseFloat(order.paidAmount) == 0.0 || order.paidAmount == null) &&
        parseFloat(order.paymentPercentage || 0) == 30.0 &&
        order.entity?.toLowerCase() === Constants.ENTITY?.VMCO?.toLowerCase()
    );
    console.log("Amount match:", 0 == null);
    // Mixed condition: paid partially and paymentPercentage is 30 and 70% amount is not paid
    const somePaid30 = OrderDetails.every(
      (order) =>
        (parseFloat(order.paidAmount || 0)  > 0.0 || order.paidAmount == null) &&
        parseFloat(order.paymentPercentage || 0) === 30.0
    );
    const paidOrders = OrderDetails.filter(
      (order) =>
        order.paymentStatus?.toLowerCase() === "paid" &&
        parseFloat(order.paidAmount) >= parseFloat(order.totalAmount)
    );

    if (paidOrders.length > 0) {
      const paidIds = paidOrders.map((order) => order.id).join(", ");
      Swal.fire({
        title: "Payment Already Done",
        text: `The following sales order(s) are already paid: ${paidIds}`,
        icon: "info",
        confirmButtonText: "OK",
      }).then(() => window.close());
      return;
    } else if (allPaid) {
      Swal.fire({
        title: "Payment Already Done",
        text: "All selected orders have already been paid.",
        icon: "info",
        confirmButtonText: "OK",
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
        title: "Payment Amount Error",
        text: "Could not process the payment amount for all orders.",
        icon: "error",
        confirmButtonText: "OK",
      }).then(() => window.close());
      return;
    }
  }, [OrderDetails]);

  //  useEffect(() => {
  //   if (!OrderDetails || Object.keys(OrderDetails).length === 0) return;

  //   const totalAmount = parseFloat(OrderDetails.totalAmount) || 0;
  //   const paidAmount = parseFloat(OrderDetails.paidAmount) || 0;
  //   const paidPercentage = parseFloat(OrderDetails.paidPercentage) || 0;
  //   const paymentPercentage = parseFloat(OrderDetails.paymentPercentage) || 0;

  //   if (
  //     OrderDetails?.paymentStatus?.toLowerCase() === "paid" &&
  //     paidAmount >= totalAmount
  //   ) {
  //     Swal.fire({
  //       title: "Payment Already Done",
  //       text: "This order has already been paid.",
  //       icon: "info",
  //       confirmButtonText: "OK",
  //     });
  //     // window.close();
  //     return;
  //   } else if (paidPercentage === 0 && paymentPercentage === 100) {
  //     setAmount(totalAmount);
  //   } else if (
  //     paidAmount === 0 &&
  //     paymentPercentage === 30 &&
  //     OrderDetails?.entity?.toLowerCase() === Constants.ENTITY?.VMCO?.toLowerCase()
  //   ) {
  //   setAmount((paymentPercentage / 100) * totalAmount)
  //   } else if (paidAmount > 0 && paymentPercentage === 30) {

  //     setAmount(totalAmount - paidAmount)
  //   } else {

  //     Swal.fire({
  //       title: "Payment Amount Error",
  //       text: "Could not process the payment amount.",
  //       icon: "error",
  //       confirmButtonText: "OK",
  //     });
  //     return;
  //   }

  // }, [OrderDetails]);

 const handleBankTransaction = async (amount, decodedOrderID) => {
  try {
    const { data } = await axios.post(
      `${API_BASE_URL}/generatePayment-link`,
      {
        id: decodedOrderID,
        endPoint: "bankTransactions/order",
        amount: amount,
      },
      {
        headers: { "Authorization": `Bearer ${token}` },
      }
    );

    console.log("Payment link generated:", data);

    if (!data || !data.details) {
      Swal.fire({
        title: "Error",
        text: "Failed to generate payment link.",
        icon: "error",
        confirmButtonText: "OK",
      }).then(() => {
        window.close();
      });
      return;
    }

    window.open(data.details.url, "_blank", "width=500,height=600");
    window.close();
  } catch (error) {
    console.error("Error generating bank transaction link:", error);

    if (error?.response?.status === 401) {
      Swal.fire({
        title: "Session Expired",
        text: "Please refresh the page to continue.",
        icon: "info",
        showCancelButton: true,
        confirmButtonText: "Reload Page",
        cancelButtonText: "Close",
      }).then(async (result) => {
        if (result.isConfirmed) {
          try {
            await generateToken();
          } catch (err) {
            console.error("Token regeneration failed:", err);
              window.close();
          }
        } else if (result.dismiss === Swal.DismissReason.cancel) {
          window.close();
        }
      });
    } else {
      Swal.fire({
        title: "Error",
        text: "Something went wrong. Please try again later.",
        icon: "error",
        confirmButtonText: "OK",
      }).then(() => {
        window.close(); // Close the current window/tab after OK
      })
    }
  }
};

  const handlePayment = async (paymentType) => {
    if (amount <= 0) {
      Swal.fire({
        title: "Invalid Amount",
        text: "The amount must be greater than zero.",
        icon: "error",
        confirmButtonText: "OK",
      }).then(() => {
        window.close(); // Close the current window/tab after OK
      });
      return;
    }
    const payload = {
      salesOrderId: decodedOrderID,
      amount,
      customerName: OrderDetails[0].companyNameEn,
      paymentType,
    };
    console.log("OrderDetails", OrderDetails[0].companyNameEn);
    // const { data } = await axios.post(
    //   `${API_BASE_URL}/payment/generate-link`,
    //   payload,
    //   {
    //    
    //   }
    // );
     const makeRequest = async () => {
    const { data } = await axios.post(
      `${API_BASE_URL}/payment/generate-link`,
      payload,
      {
        headers: { "Authorization": `Bearer ${token}` },
      }
    );
    return data;
  };
try {
    const response = await makeRequest();
    window.open(response.data.InvoiceURL, "_blank", "width=500,height=600");
    window.close();
  } catch (error) {
    console.error("Error generating payment link:", error);
     if (error.response && error.response.status === 401) {
     Swal.fire({
  title: "Session Expired",
  text: "Please refresh the page to continue.",
  icon: "info",
  showCancelButton: true,
  confirmButtonText: "Reload Page",
  cancelButtonText: "Close",
}).then(async (result) => {
  if (result.isConfirmed) {
    try {
      await generateToken(); // Call your API to get new token
     
    } catch (error) {
      console.error("Token regeneration failed:", error);
      Swal.fire("Error", "Unable to refresh session. Please try again.", "error");
      window.close();
    }
  } else if (result.dismiss === Swal.DismissReason.cancel) {
    window.close(); // Close the tab
  }
});

    } else {
      Swal.fire({
        title: "Error",
        text: "Failed to generate payment link. Please try again later.",
        icon: "error",
        confirmButtonText: "OK",
      }).then(() => {
        window.close(); // Close the current window/tab after OK
      });
    }
    
  }
    // navigate(data?.data?.InvoiceURL)
  };
  return (
    <div className="options-container">
      <div className="button-wrapper">
        {(OrderDetails[0]?.entity?.toLowerCase() ===
          Constants.ENTITY?.VMCO?.toLowerCase() ||
          OrderDetails[0]?.entity?.toLowerCase() ===
            Constants.ENTITY?.NAQI?.toLowerCase()) && (
          <button
            onClick={() => handleBankTransaction(amount, decodedOrderID)}
            className="option-button blue"
          >
            <FontAwesomeIcon icon={faBuilding} style={{ marginRight: "10px" }} />
            Bank Transaction
          </button>
        )}
        <button
          onClick={() => handlePayment("CardPay")}
          className="option-button card"
        >
          <FontAwesomeIcon icon={faCreditCard} style={{ marginRight: "10px" }} />
          Cards Pay
        </button>
        {(OrderDetails[0]?.entity?.toLowerCase() ===
          Constants.ENTITY?.DAR?.toLowerCase() ||
          OrderDetails[0]?.entity?.toLowerCase() ===
            Constants.ENTITY?.GMTC?.toLowerCase() ||
          OrderDetails[0]?.entity?.toLowerCase() ===
            Constants.ENTITY?.SHC?.toLowerCase()) && (
          <button
            onClick={() => handlePayment("Apple Pay")}
            className="option-button black"
          >
            <FontAwesomeIcon icon={faMobile} style={{ marginRight: "10px" }} />
            Apple Pay
          </button>
        )}
      </div>
      <style>
        {`.options-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  padding: 20px;
  background-color: #f3f4f6;
}

.button-wrapper {
  display: flex;
  flex-direction: column;
  gap: 20px;
  width: 100%;
  max-width: 400px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  border-radius: 12px;
  padding: 50px;
    background-color: #ffffff;
}

.option-button {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  width: 100%;
  padding: 15px;
  font-size: 18px;
  font-weight: 600;
  color: #fff;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  transition: background-color 0.3s ease;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}


.option-button.blue {
  background-color: #2563eb;
}

.option-button.blue:hover {
  background-color: #1d4ed8;
}

.option-button.card {
  background-color: #0293cc;
}

.option-button.card:hover {
  background-color:rgb(12, 170, 233);
}

.option-button.black {
  background-color: #000;;
}

`}
      </style>
    </div>
  );
};

export default OptionsPage;
