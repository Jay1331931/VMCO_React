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
        window.close();
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
            } else if (data?.data?.InvoiceURL) {
                window.location.href = data.data.InvoiceURL;
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
            <h2>Payment Details</h2>

            {!status && (
                <div className="payment-details">
                    <p>Order ID: {orderId}</p>
                    <p>Amount: {amount} SAR</p>
                    <p>Customer Name: {customerName || 'N/A'}</p>
                </div>
            )}
            {status === 'failed' && (
                <div className="payment-details">
                    <h2>{status}</h2>
                    <p>{message}</p>
                </div>
            )}
            {status && status !== 'failed' && (
                <div className="payment-details">
                    <h2>{status}</h2>
                    <p>paymentId: {paymentId}</p>
                </div>
            )}

            {status && (
                <button
                    onClick={handleCancel}
                    disabled={isLoading}
                    className="cancel-btn"
                >
                    Close
                </button>
            )}
            {!status && (
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
            )}

            <style>{`
                /* PaymentPage.css */
                .payment-container {
                max-width: 500px;
                margin: 2rem auto;
                padding: 2rem;
                border: 1px solid #ddd;
                border-radius: 8px;
                text-align: center;
                }

                .payment-details {
                margin: 2rem 0;
                padding: 1rem;
                background: #f9f9f9;
                border-radius: 4px;
                }

                .payment-actions {
                display: flex;
                justify-content: space-between;
                gap: 1rem;
                }

                .cancel-btn {
                background: #f44336;
                color: white;
                }

                .continue-btn {
                background: #4CAF50;
                color: white;
                }

                button {
                padding: 0.5rem 1rem;
                border: none;
                border-radius: 4px;
                cursor: pointer;
                flex: 1;
                }

                button:disabled {
                opacity: 0.6;
                cursor: not-allowed;
                }
            `}</style>
        </div>
    );
};

export default PaymentPage;