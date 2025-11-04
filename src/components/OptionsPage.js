import React, { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Constants from "../constants";
import Swal from "sweetalert2";
import axios from "axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBuilding, faCreditCard, faMobile } from "@fortawesome/free-solid-svg-icons";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import api from "../utilities/api"
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
   const [TempOrderDetails, setTempOrderDetails] = useState([]);
  const { orderId ,orderType} = useParams();
  const [decodedOrderID, setDecodedOrderID] = useState(null);
  const [tempdecodedOrderID, setTempDecodedOrderID] = useState(null);
  const  [DecodedorderTpe,setDecodedOrderType]=useState(null)
  const [amount, setAmount] = useState(0);

  const { token ,user} = useAuth();
  const navigate = useNavigate();
  const cookieToken = getCookie("token");
  // if (orderId &&!token ){
  //   try {
  //     const generateToken=async () => {

  //       const response = await axios.post(`/auth/temporary-token-generation`,{"role":"Guest","userId":0,"userName":"payment" });
  //       return response?.data?.details;
  //     }

  //   } catch (error) {
  //     console.error("Error generating token:", error);
  //   }

  // }
  console.log("orderType",orderType)
  const fetchDecodeddata = useCallback(async () => {
  try {
    const token = localStorage.getItem("token"); // always use latest
    const { data } = await api.get(
      `/decode-ids?encryptedorderIds=${orderId}&salesOrderType=${orderType}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if(data?.details?.orderType?.toLowerCase()==="cart"){
      setDecodedOrderType(data?.details?.orderType)
      setTempDecodedOrderID(data?.details?.orderIds)
    }else{
 setDecodedOrderID(data?.details?.orderIds);
    setDecodedOrderType(data?.details?.orderType)
    }

   
  } catch (error) {
    console.error("Failed to fetch decoded data", error);

    // if (error.response?.status === 401) {
    //   console.warn("Token invalid. Generating a new one...");

    //   const newToken = await generateToken();
    //   if (newToken) {
    //     try {
    //       const { data } = await axios.get(
    //         `/decode-ids?encryptedorderIds=${orderId}`,
    //         { headers: { Authorization: `Bearer ${newToken}` } }
    //       );
    //       setDecodedOrderID(data?.details?.orderIds);
    //     } catch (retryError) {
    //       console.error("Retry after new token failed:", retryError);
    //     }
    //   }
    // }
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

    // if (error.response?.status === 401) {
    //   console.warn("Token invalid in sale order. Generating a new one...");

    //   const newToken = await generateToken();
    //   if (newToken) {
    //     try {
    //       const ids = decodedOrderID.toString().split(",");
    //       const results = await Promise.all(
    //         ids.map((id) =>
    //           axios.get(`/sales-order/id/${parseInt(id)}`, {
    //             headers: { Authorization: `Bearer ${newToken}` },
    //           })
    //         )
    //       );

    //       const allOrders = results.map((res) => res.data.data);
    //       setOrderDetails(allOrders);
    //     } catch (retryError) {
    //       console.error("Retry after new token failed:", retryError);
    //     }
    //   }
    // }
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

    // if (error.response?.status === 401) {
    //   console.warn("Token invalid in sale order. Generating a new one...");

    //   const newToken = await generateToken();
    //   if (newToken) {
    //     try {
    //       const ids = decodedOrderID.toString().split(",");
    //       const results = await Promise.all(
    //         ids.map((id) =>
    //           axios.get(`/sales-order/id/${parseInt(id)}`, {
    //             headers: { Authorization: `Bearer ${newToken}` },
    //           })
    //         )
    //       );

    //       const allOrders = results.map((res) => res.data.data);
    //       setOrderDetails(allOrders);
    //     } catch (retryError) {
    //       console.error("Retry after new token failed:", retryError);
    //     }
    //   }
    // }
  }
}, [tempdecodedOrderID]);

//  const generateToken = async () => {
//       try {
//         const { data } = await axios.post(
//           `/auth/temporary-token-generation`,
//           {
//             role: "Guest",
//             userId: 0,
//             userName: "payment",
//           }
//         );
//         const newToken = data?.details?.token;
//     if (newToken) {
//       localStorage.setItem("token", newToken);
     
//       return newToken;
//     }
//         console.log("Temporary Token Response:", data.details);
//       } catch (error) {
//         console.error("Error generating temporary token:", error);
//       }
//     };
//   useEffect(() => {
//     if(!orderId){
//       return;
//     }
//     if (orderId && !cookieToken) {
//       generateToken();
//     } 
//   }, [orderId, token]);

  useEffect(() => {
    fetchDecodeddata();
  }, [fetchDecodeddata]);
  // const fetchSaleOrder = useCallback(async () => {
  //   try {
  //     if (!decodedOrderID) return;
  //    console.log("Decoded Order ID:", decodedOrderID);
  //     const { data } = await axios.get(
  //       `/sales-order/id/${decodedOrderID}`,
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
    console.log("Amount match:", 0 == null,totalAmount);
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

    // Check if all orders are fully paid
    // const allPaid = OrderDetails.every(
    //   (order) =>
    //     order.paymentStatus?.toLowerCase() === "paid" &&
    //     parseFloat(order.paidAmount) >= parseFloat(order.totalAmount)
    // );
    const allPaid = OrderDetails.every(
  (order) =>
    order.paymentStatus?.toLowerCase() === "paid" &&
    Math.floor(Number(order.paidAmount)) >= Math.floor(Number(order.totalAmount))
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
    Math.floor(Number(order.paidAmount)) >= Math.floor(Number(order.totalAmount))
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
        headers: { "Authorization": `Bearer ${cookieToken}` },
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

    window.location.replace(data.details.url);
    // window.close();
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
    //       try {
    //        const responseToken= await generateToken();
    //         const { data } = await api.post(
    //   `/generatePayment-link`,
    //   {
    //     id: decodedOrderID,
    //     endPoint: "bankTransactions/order",
    //     amount: amount,
    //   },
    //   {
    //     headers: { "Authorization": `Bearer ${responseToken}` },
    //   }
    // );

    // console.log("Payment link generated:", data);

    // if (!data || !data.details) {
    //   Swal.fire({
    //     title: "Error",
    //     text: "Failed to generate payment link.",
    //     icon: "error",
    //     confirmButtonText: "OK",
    //   }).then(() => {
    //     window.close();
    //   });
    //   return;
    // }

    // window.location.replace(data.details.url);

    //       } catch (err) {
    //         console.error("Token regeneration failed:", err);
    //           window.close();
    //       }
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
 
//    if (paymentType) {
//   Swal.fire({
//     title: 'Card Payment Coming Soon',
//     text: 'Please contact your sales executive for more details.',
//     icon: 'info',
//     confirmButtonText: 'OK',
//     confirmButtonColor: '#1976d2', // optional: match your theme
//   });
//   return;
// }

    console.log("paymentType",amount)
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

//     let payload;
//     if(DecodedorderTpe?.toLowerCase()==="cart"){
//  payload = {
//       salesOrderId: tempdecodedOrderID,
//       amount,
//       customerName: TempOrderDetails[0]?.orderDetails?.companyNameEn,
//       paymentType,
//       orderType:DecodedorderTpe
//     };
//     }else{
//  payload = {
//       salesOrderId: decodedOrderID,
//       amount,
//       customerName: OrderDetails[0].companyNameEn,
//       paymentType,
//     };
//     }
    
    console.log("OrderDetails", OrderDetails,user);
    // const { data } = await axios.post(
    //   `/payment/generate-link`,
    //   payload,
    //   {
    //    
    //   }
    // );
  //    const makeRequest = async () => {
  //   const { data } = await api.post(
  //     `/payment/generate-link`,
  //     payload,
  //     {
  //       headers: { "Authorization": `Bearer ${token}` },
  //     }
  //   );
  //   return data;
  // };

try {
  const orderIdEncoded =DecodedorderTpe?.toLowerCase()==="cart" ? encodeURIComponent(btoa(tempdecodedOrderID)) :  encodeURIComponent(btoa(decodedOrderID));
const amountEncoded = encodeURIComponent(btoa(amount.toString()));
// const emailEncoded = encodeURIComponent(btoa(CustomerDetails?.contact_email));
// const companyEncoded = encodeURIComponent(btoa(OrderDetails[0]?.companyNameEn));
const customerIdEncoded=DecodedorderTpe?.toLowerCase()==="cart" ? encodeURIComponent(btoa(TempOrderDetails[0]?.orderDetails?.customerId)) :encodeURIComponent(btoa(OrderDetails[0]?.customerId))
const orderTypeEncoded=DecodedorderTpe?.toLowerCase()==="cart" ? encodeURIComponent(btoa(DecodedorderTpe)):encodeURIComponent(btoa("orders"))
    // const response = await makeRequest();

  let URL 
  if(paymentType?.toLowerCase()=='cardpay'){
 URL= `${window.location.protocol}//${window.location.host}/tapcard/${orderIdEncoded}/${amountEncoded}/${customerIdEncoded}/${orderTypeEncoded}`;
  
  }else{
     URL= `${window.location.protocol}//${window.location.host}/applyPay/${orderIdEncoded}/${amountEncoded}/${customerIdEncoded}/${orderTypeEncoded}`;
  
  }
  window.location.replace(URL)
    // window.close();
    // navigate(URL)
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
      // await generateToken(); // Call your API to get new token
     
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
         ( OrderDetails[0]?.entity?.toLowerCase()|| TempOrderDetails[0]?.entity?.toLowerCase()) ===
            Constants.ENTITY?.NAQI?.toLowerCase()) && (
          <button
            onClick={() => handleBankTransaction(amount, DecodedorderTpe.toLowerCase()==="cart" ?  tempdecodedOrderID :decodedOrderID)}
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
        {/* {(OrderDetails[0]?.entity?.toLowerCase() ===
          Constants.ENTITY?.DAR?.toLowerCase() ||
          OrderDetails[0]?.entity?.toLowerCase() ===
            Constants.ENTITY?.GMTC?.toLowerCase() ||
          OrderDetails[0]?.entity?.toLowerCase() ===
            Constants.ENTITY?.SHC?.toLowerCase() || [Constants.ENTITY?.SHC?.toLowerCase(), Constants.ENTITY?.GMTC?.toLowerCase(),Constants.ENTITY?.DAR?.toLowerCase()].includes(TempOrderDetails[0]?.entity?.toLowerCase())) && (
          <button
            onClick={() => handlePayment("Apple Pay")}
            className="option-button black"
          >
            <FontAwesomeIcon icon={faMobile} style={{ marginRight: "10px" }} />
            Apple Pay
          </button>
        )} */}
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
