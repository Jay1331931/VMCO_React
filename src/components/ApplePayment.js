import React, { useEffect, useRef, useState } from 'react';
// import './CardPayment.css';

const ApplePayment = () => {
  const AppleContainerRef = useRef(null);
  const unmountRef = useRef(null);
  const [SdkLoaded,setSdkLoaded]=useState(false)

  useEffect(() => {
    // Check if CardSDK is loaded
    if (window.TapApplepaySDK) {
      initializeCardSDK();
    } else {
      // Wait for CardSDK to load
      const checkSDK = setInterval(() => {
        if (window.TapApplepaySDK) {
          clearInterval(checkSDK);
          initializeCardSDK();
        }
      }, 100);

      // Cleanup interval after 10 seconds
      setTimeout(() => clearInterval(checkSDK), 10000);
    }

    return () => {
      // Cleanup function
      if (unmountRef.current) {
        unmountRef.current();
      }
    };
  }, []);

  const initializeCardSDK = () => {
    try {
      const { render, ThemeMode, SupportedNetworks, Scope, Environment, Locale, ButtonType, Edges } =
				window.TapApplepaySDK
      
      if (AppleContainerRef.current) {
        const { unmount } = render(
				{
                    // debug: false,
					publicKey: 'pk_test_FcYVGop4TyCRLb0qBhIHJzmn',
					environment: Environment.Development,
					scope: Scope.TapToken,
					merchant: {
						domain: window.location.hostname,  // 'talabpoint.com',
						id: '67979587'
					},
					transaction: {
						currency: 'SAR',
						amount: '3'
					},
					acceptance: {
						supportedBrands: [SupportedNetworks.Mada, SupportedNetworks.Visa, SupportedNetworks.MasterCard],
						// supportedCardsWithAuthentications: ['3DS']
					},
          features: {
            supportsCouponCode: false,
            // incase you want to get the customer info for express checkout
            // shippingContactFields: ['name', 'phone', 'email']
          },

					customer: {
						// id: 'cus_xxx',
						name: [
							{
								locale: 'en',
								first: 'test',
								last: 'tester',
								middle: 'test'
							}
						],
						contact: {
							email: 'test@gmail.com',
                            phone: {
                                number: '1000000000',
                                countryCode: '+20'
                            }
						}
					},
					interface: {
						locale: Locale.EN,
						theme: ThemeMode.DARK,
						type: ButtonType.BUY,
						edges: Edges.CURVED
					},
					onCancel: async () => {
						console.log('onCancel')
					},
					onError: async (error) => {
						console.log('onError', error)
					},
					onSuccess: async (data) => {
						console.log('onSuccess', data)
					},
					onReady: async () => {
						console.log('onReady')
					}
				});

        unmountRef.current = unmount;
      }
    } catch (error) {
      console.error('Error initializing AppleSDK:', error);
    }
  };

  return (
    <div className="card-payment-container">
      <div className="card-payment-header">
        <h1>Apple Payment</h1>
        <p>Complete your payment securely using Tap Card SDK</p>
      </div>
      
      <div className="card-payment-content">
        <div className="payment-info">
          <h2>Payment Details</h2>
          <div className="payment-summary">
            <div className="summary-item">
              <span>Amount:</span>
              <span>1 SAR</span>
            </div>
            <div className="summary-item">
              <span>Currency:</span>
              <span>Saudi Riyal (SAR)</span>
            </div>
            <div className="summary-item">
              <span>Customer:</span>
              <span>Test Test</span>
            </div>
            <div className="summary-item">
              <span>Phone:</span>
              <span>+20 1000000000</span>
            </div>
            <div className="summary-item">
              <span>Email:</span>
              <span>test@gmail.com</span>
            </div>
          </div>
        </div>

        <div className="card-form-container">
          <h3>Apple pay Information</h3>
          <div id="apple-pay-button" ref={AppleContainerRef}></div>
        </div>
      </div>

      <div className="card-payment-footer">
        <p className="security-note">
          🔒 Your payment information is secure and encrypted
        </p>
        <p className="supported-cards">
          Supported: American Express, Visa, Mastercard, MADA
        </p>
      </div>
    </div>
  );
};

export default ApplePayment;
