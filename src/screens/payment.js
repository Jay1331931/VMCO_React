// pages/PaymentPage.js
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../i18n';
import { useTranslation } from 'react-i18next';
import Swal from 'sweetalert2';
import { useAuth } from '../context/AuthContext';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

const PaymentPage = () => {
    const { i18n } = useTranslation();
    const { t } = useTranslation();
    const { token } = useAuth();

    const location = useLocation();
    const query = new URLSearchParams(location.search);
    const orderId = query.get('orderId');
    const amount = query.get('amount');
    const customerName = query.get('customerName') || null;
    const linkExpiryDays = query.get('linkExpiryDays') || 1;
    const status = query.get('status');
    const message = query.get('message');
    const paymentId = query.get('paymentId');

    const [isLoading, setIsLoading] = useState(false);

    const handleCancel = () => {
        // window.close();
         const URL = `${window.location.protocol}//${window.location.host}/orders`
        
        window.location.replace(URL)
    };

    const handleContinue = async () => {
        setIsLoading(true);
        try {
            const { data } = await axios.post(
                `${API_BASE_URL}/payment/generate-link`,
                {
                    salesOrderId: orderId,
                    amount: amount,
                    customerName: customerName,
                    linkExpiryDays: linkExpiryDays
                },
                {
                   
                    headers: {
                        "Authorization": `Bearer ${token}`
                    }
                }
            );
            console.log('Payment response:', data);
            if (!data || data.status !== 'Success') {
                Swal.fire({
                    icon: 'error',
                    title: t('Payment failed'),
                    text: t(data?.message || 'An error occurred while processing your payment.'),
                    confirmButtonText: t('OK')
                });
                setIsLoading(false);
                return;
            } else if (data?.data?.url) {
                window.location.href = data.data.url;
            } else {
                Swal.fire({
                    icon: 'error',
                    title: t('Payment failed'),
                    text: t('No payment link received from the server.'),
                    confirmButtonText: t('OK')
                });
                setIsLoading(false);
            }
        } catch (error) {
            console.log('Payment error:', error);
            Swal.fire({
                icon: 'error',
                title: t('Payment error'),
                text: t('An error occurred while initiating the payment.'),
                confirmButtonText: t('OK')
            });
            setIsLoading(false);
        }
    };

   return (
  <div className="payment-container">
    {!status && (
      <>
        <h2 className="title">Confirm Your Payment</h2>
        <div className="payment-details">
          <p><strong>Order ID:</strong> {orderId}</p>
          <p><strong>Amount:</strong> {amount} SAR</p>
          <p><strong>Customer Name:</strong> {customerName || 'N/A'}</p>
        </div>

        <div className="payment-actions">
          <button
            onClick={handleCancel}
            disabled={isLoading}
            className="cancel-btn"
          >
            Cancel
          </button>

          <button
            onClick={handleContinue}
            disabled={isLoading}
            className="continue-btn"
          >
            {isLoading ? 'Processing...' : 'Continue to Payment'}
          </button>
        </div>
      </>
    )}

    {status && (
      <div
        className={`status-card ${
          status === 'success'
            ? 'success'
            : status === 'failed'
            ? 'failed'
            : 'pending'
        }`}
      >
        <div className="icon">
          {status === 'success' && (
            <span className="checkmark">✔</span>
          )}
          {status === 'failed' && (
            <span className="crossmark">✖</span>
          )}
          {status !== 'success' && status !== 'failed' && (
            <span className="loader"></span>
          )}
        </div>

        <h2 className="status-title">
          {status === 'success'
            ? 'Payment Successful'
            : status === 'failed'
            ? 'Payment Failed'
            : 'Processing Payment...'}
        </h2>

        {message && <p className="status-message">{message}</p>}
        {paymentId && status === 'success' && (
          <p className="status-message">Payment ID: {paymentId}</p>
        )}

        <button onClick={handleCancel} className="close-btn">
          Close
        </button>
      </div>
    )}

    <style>{`
      .payment-container {
        max-width: 480px;
        margin: 3rem auto;
        padding: 2rem;
        background: #fff;
        border-radius: 16px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        text-align: center;
        font-family: 'Inter', sans-serif;
      }

      .title {
        font-size: 1.6rem;
        font-weight: 600;
        color: #333;
        margin-bottom: 1.5rem;
      }

      .payment-details {
        background: #f7f9fc;
        padding: 1rem 1.5rem;
        border-radius: 10px;
        text-align: left;
        line-height: 1.6;
        color: #333;
      }

      .payment-actions {
        margin-top: 2rem;
        display: flex;
        justify-content: space-between;
        gap: 1rem;
      }

      button {
        flex: 1;
        padding: 0.75rem 1rem;
        border: none;
        border-radius: 8px;
        font-size: 1rem;
        font-weight: 500;
        cursor: pointer;
        transition: 0.2s ease;
      }

      .cancel-btn {
        background: #f44336;
        color: white;
      }
      .cancel-btn:hover {
        background: #d7382c;
      }

      .continue-btn {
        background: #4caf50;
        color: white;
      }
      .continue-btn:hover {
        background: #3e8e41;
      }

      .status-card {
        padding: 2rem;
        border-radius: 12px;
        text-align: center;
      }

      .status-card.success {
        background: #e6f9ee;
        color: #1b5e20;
      }

      .status-card.failed {
        background: #fdeaea;
        color: #b71c1c;
      }

      .status-card.pending {
        background: #fff8e1;
        color: #8d6e63;
      }

      .icon {
        font-size: 3rem;
        margin-bottom: 1rem;
      }

      .checkmark {
        color: #4caf50;
        font-size: 3rem;
      }

      .crossmark {
        color: #f44336;
        font-size: 3rem;
      }

      .loader {
        border: 4px solid #ddd;
        border-top: 4px solid #ff9800;
        border-radius: 50%;
        width: 40px;
        height: 40px;
        animation: spin 1s linear infinite;
        display: inline-block;
      }

      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }

      .status-title {
        font-size: 1.5rem;
        font-weight: 600;
        margin-bottom: 0.5rem;
      }

      .status-message {
        font-size: 1rem;
        margin-bottom: 1.5rem;
      }

      .close-btn {
        background: #007bff;
        color: #fff;
        border: none;
        padding: 0.7rem 1.5rem;
        border-radius: 8px;
        cursor: pointer;
      }
      .close-btn:hover {
        background: #0056b3;
      }

      @media (max-width: 480px) {
        .payment-container {
          margin: 1rem;
          padding: 1.5rem;
        }
      }
    `}</style>
  </div>
);

};

export default PaymentPage;