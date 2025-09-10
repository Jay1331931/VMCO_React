import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { useParams } from "react-router-dom";
import { useAuth } from '../context/AuthContext';
import Swal from 'sweetalert2';
import { useTranslation } from 'react-i18next';
import api from '../utilities/api';
const TapCardPayment = () => {
  const [sdkLoaded, setSdkLoaded] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [paymentProcessing,setPaymentProcessing]=useState(false)
  const { orderId ,useremail,amount,companyNameEn} = useParams();
    const { token ,user} = useAuth();
      const { t } = useTranslation();
  console.log("user",useremail,orderId,amount,companyNameEn)
  const orderIdDecoded = atob(decodeURIComponent(orderId));
const amountDecoded = atob(decodeURIComponent(amount));
const emailDecoded = atob(decodeURIComponent(useremail));
const companyDecoded = atob(decodeURIComponent(companyNameEn));
const TAP_PUIBLIC_KEY = process.env.REACT_APP_PAYMENT_TAP_PUBLIC_KEY;
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;
  useEffect(() => {
    // Check if script is already loaded
    if (window.CardSDK) {
      setSdkLoaded(true);
      return;
    }

    // Load the Tap Card SDK script
    const script = document.createElement('script');
    script.src = 'https://tap-sdks.b-cdn.net/card/1.0.2/index.js';
    script.async = true;
    script.onload = () => {
      setSdkLoaded(true);
    };
    script.onerror = () => {
      console.error('Failed to load Tap Card SDK');
    };

    document.head.appendChild(script);

    return () => {
      // Don't try to clean up the SDK as it causes errors
    };
  }, []);

  useEffect(() => {
    if (sdkLoaded && !initialized) {
      // Small delay to ensure DOM is ready
      setTimeout(initializeTapCard, 100);
    }
  }, [sdkLoaded, initialized]);

  // useEffect(()=>{
  //   if(paymentProcessing)
  //   {
  //     setInitialized(true)
  //   }
  // },[paymentProcessing])
console.log(" process.env.PAYMENT_TAP_PUBLIC_KEY", TAP_PUIBLIC_KEY)
  const initializeTapCard = () => {
    if (window.CardSDK && !initialized) {
    //   const { renderTapCard, Theme, Currencies, Direction, Edges, Locale } = window.CardSDK;
      const { renderTapCard, Theme, Currencies, Direction, Edges, Locale, updateCardConfiguration,loadSavedCard} = window.CardSDK;
      try {
        // Make sure the container exists
        const container = document.getElementById('card-sdk-container');
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
        container.innerHTML = '';
        
        // Create the element that the SDK expects
        const sdkElement = document.createElement('div');
        sdkElement.id = 'card-sdk-id';
        container.appendChild(sdkElement);
        
        // Initialize the SDK
        renderTapCard('card-sdk-id', {
          publicKey: TAP_PUIBLIC_KEY, // Replace with your actual key
          merchant: {
            id: process.env.REACT_APP_TAP_MERCHANT_ID,
          },
          transaction: {
            amount: parseFloat(amountDecoded),
            currency: Currencies.SAR,
          },
          customer: {
            id: '',//'cus_TS06A4420250631e6HP0809471',
            name: [
              {
                lang: Locale.EN,
                first: companyDecoded,
                // last: 'Test',
                // middle: 'Test',
              },
            ],
            // nameOnCard: 'Test Test',
            editable: true,
            contact: {
              email: emailDecoded,
              // phone: {
              //   countryCode: '20',
              //   number: '1000000000',
              // },
            },
          },
          acceptance: {
            supportedBrands: ['MADA', 'VISA', 'MASTERCARD'],
            supportedCards: 'ALL',
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
            console.log('Tap Card SDK Ready');
            setInitialized(true);
          },
          onFocus: () => console.log('onFocus'),
          onBinIdentification: (data) => console.log('onBinIdentification', data),
          onValidInput: (data) =>  console.log('onValidInputChange', data),
          onInvalidInput: (data) => console.log('onInvalidInput', data),
          onChangeSaveCardLater: (isSaveCardSelected) => 
            console.log(isSaveCardSelected, ' :onChangeSaveCardLater'),
          onError: (data) => {
            console.log('onError', data);
            setIsProcessing(false);
          },
          onSuccess: (data) => {
          
            createChargeRequest(data);
          },
        });
      } catch (error) {
        console.error('Error initializing Tap Card:', error);
      }
    }
  };

  const createToken = () => {
    if (window.CardSDK && window.CardSDK.tokenize) {
       setPaymentProcessing(true)
      setIsProcessing(true);
     
      window.CardSDK.tokenize();
    } else {
      console.error('Tap Card SDK not loaded or tokenize method not available');
      alert('Payment system not ready. Please try again.');
    }
  };

  const createChargeRequest = async(tokenDATA) => {
  
     const payload = {
      salesOrderId: orderIdDecoded,
      amount:amountDecoded,
      customerName: companyDecoded,
      tokenData:tokenDATA,
    };
    // Simulate API call
     const { data } = await api.post(
          `/payment/generate-link`,
          payload,
          {
            headers: { "Authorization": `Bearer ${token}` },
          }
        );
     
        console.log("data.url",data)
     
          window.location.replace(data?.data?.url);
         setIsProcessing(false);
            setPaymentProcessing(false)
 
      
    // setTimeout(() => {
    //   setIsProcessing(false);
    //   // alert(`Payment tokenized successfully! Token: ${token.id}`);
    // }, 2000);
  };



  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif', maxWidth: '500px', margin: '0 auto' }}>
      <h2 style={{ color: '#333', textAlign: 'center' }}>Checkout</h2>
      <p style={{ fontSize: '18px', textAlign: 'center', marginBottom: '20px' }}>
        Total Amount: <strong>{amountDecoded}SAR</strong>
      </p>
      
      <div 
        id="card-sdk-container"
        style={{ 
          minHeight: '250px', 
          marginBottom: '20px', 
          border: '1px solid #ddd', 
          borderRadius: '8px',
          padding: '15px',
          backgroundColor: '#f9f9f9',
          display: initialized ?  !paymentProcessing ?'block':"none" : 'none'
        }}
      />
      
      {!initialized && sdkLoaded && (
        <div style={{ 
          minHeight: '250px', 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center',
          marginBottom: '20px', 
          border: '1px solid #ddd', 
          borderRadius: '8px',
          padding: '15px',
          backgroundColor: '#f0f0f0'
        }}>
          <div style={{ textAlign: 'center', color: '#6c757d' }}>
            Initializing payment form...
          </div>
        </div>
      )}
      {
        paymentProcessing ? <div style={{ 
          minHeight: '250px', 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center',
          marginBottom: '20px', 
          border: '1px solid #ddd', 
          borderRadius: '8px',
          padding: '15px',
          backgroundColor: '#f0f0f0'
        }}><div style={{ textAlign: 'center', color: '#6c757d' }}>
            Payment Processing...
          </div> </div>: null
      }
      
      <div style={{ textAlign: 'center', marginBottom: '15px' }}>
        <button 
          onClick={createToken}
          disabled={isProcessing || !initialized}
          style={{
            padding: '12px 24px',
            backgroundColor: (isProcessing || !initialized) ? '#6c757d' : '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: (isProcessing || !initialized) ? 'not-allowed' : 'pointer',
            fontSize: '16px',
            fontWeight: 'bold',
            width: '200px',
            marginRight: '10px'
          }}
        >
          {isProcessing ? 'Processing...' : 'Pay Now'}
        </button>
      </div>
      
      {!sdkLoaded && (
        <div style={{ 
          textAlign: 'center', 
          color: '#6c757d', 
          marginTop: '20px',
          fontSize: '14px'
        }}>
          Loading payment system...
        </div>
      )}
    </div>
  );
};

export default TapCardPayment;