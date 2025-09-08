import React, { useEffect, useState } from 'react';

const TapCardPayment = () => {
  const [sdkLoaded, setSdkLoaded] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [initialized, setInitialized] = useState(false);

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

  const initializeTapCard = () => {
    if (window.CardSDK && !initialized) {
    //   const { renderTapCard, Theme, Currencies, Direction, Edges, Locale } = window.CardSDK;
      const { renderTapCard, Theme, Currencies, Direction, Edges, Locale, updateCardConfiguration,loadSavedCard} = window.CardSDK;
      try {
        // Make sure the container exists
        const container = document.getElementById('card-sdk-container');
        if (!container) {
          console.error('Container not found');
          return;
        }
        
        // Clear any existing content
        container.innerHTML = '';
        
        // Create the element that the SDK expects
        const sdkElement = document.createElement('div');
        sdkElement.id = 'card-sdk-id';
        container.appendChild(sdkElement);
        
        // Initialize the SDK
        renderTapCard('card-sdk-id', {
          publicKey: 'pk_test_FcYVGop4TyCRLb0qBhIHJzmn', // Replace with your actual key
          merchant: {
            id: '67979587',
          },
          transaction: {
            amount: 10,
            currency: Currencies.SAR,
          },
          customer: {
            id: 'cus_TS06A4420250631e6HP0809471',
            name: [
              {
                lang: Locale.EN,
                first: 'Test',
                last: 'Test',
                middle: 'Test',
              },
            ],
            nameOnCard: 'Test Test',
            editable: true,
            contact: {
              email: 'test@gmail.com',
              phone: {
                countryCode: '20',
                number: '1000000000',
              },
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
          onValidInput: (data) => console.log('onValidInputChange', data),
          onInvalidInput: (data) => console.log('onInvalidInput', data),
          onChangeSaveCardLater: (isSaveCardSelected) => 
            console.log(isSaveCardSelected, ' :onChangeSaveCardLater'),
          onError: (data) => {
            console.log('onError', data);
            setIsProcessing(false);
          },
          onSuccess: (data) => {
            console.log('Tokenization successful:', data);
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
      setIsProcessing(true);
      window.CardSDK.tokenize();
    } else {
      console.error('Tap Card SDK not loaded or tokenize method not available');
      alert('Payment system not ready. Please try again.');
    }
  };

  const createChargeRequest = (token) => {
    console.log('Creating charge with token:', token);
    // Simulate API call
    setTimeout(() => {
      setIsProcessing(false);
      alert(`Payment tokenized successfully! Token: ${token.id}`);
    }, 2000);
  };



  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif', maxWidth: '500px', margin: '0 auto' }}>
      <h2 style={{ color: '#333', textAlign: 'center' }}>Checkout</h2>
      <p style={{ fontSize: '18px', textAlign: 'center', marginBottom: '20px' }}>
        Total Amount: <strong>10 SAR</strong>
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
          display: initialized ? 'block' : 'none'
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