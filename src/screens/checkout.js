import React, { useState } from 'react';
import Sidebar from '../components/Sidebar';
import '../styles/components.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronDown, faChevronUp } from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import QuantityController from '../components/QuantityController';

function Checkout() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('');
const [hideMenu, setHideMenu] = useState(false);
    return (
        <Sidebar
hideMobileBottomMenu={hideMenu} title={t('Your Cart')} dir={t('direction')}>
            <div className="cart-header">
                <h2 className="cart-title">Secure Checkout</h2>
            </div>
            <div className="cart-main-content">
                <div className="cart-items-panel">

                    <div className="category-section">
                        <div className="checkout-category-items">
                            <p>Delivering to Customer Company Name</p>
                            <p>Delivering to JP Nagar</p>
                            <p></p>
                            <p>Payment Methods</p>
                            <div className='checkout-payment-methods'>
                                <input
                                    type='checkbox'
                                    checked={selectedPaymentMethod === 'credit'}
                                    onChange={() => setSelectedPaymentMethod('credit')}
                                />
                                <label>
                                    Credit: 445 <span className='checkout-currency-sub'>SAR</span>
                                </label>
                            </div>

                            <div className='checkout-payment-methods'>
                                <input
                                    type='checkbox'
                                    checked={selectedPaymentMethod === 'advance'}
                                    onChange={() => setSelectedPaymentMethod('advance')}
                                />
                                <label>
                                    Advance Pay: 100 <span className='checkout-currency-sub'>SAR</span> Balance
                                </label>
                            </div>

                            <div className='checkout-payment-methods'>
                                <input
                                    type='checkbox'
                                    checked={selectedPaymentMethod === 'prepayment'}
                                    onChange={() => setSelectedPaymentMethod('prepayment')}
                                />
                                <label>Pre-payment</label>
                            </div>

                            <div className='checkout-payment-methods'>
                                <input
                                    type='checkbox'
                                    checked={selectedPaymentMethod === 'cod'}
                                    onChange={() => setSelectedPaymentMethod('cod')}
                                />
                                <label>COD</label>
                            </div>
                            </div>

                        </div>

                    </div>
                    <div className="checkout-summary-panel">
                        <div className="checkout-summary-header">
                            <p>Items: 6</p>
                            <p>Delivery: 15 Apr 2025</p>
                        </div>
                        <div className="checkout-summary">
                            <p>Total Amount 708 <span className='checkout-currency-sub'>SAR</span></p>
                            <p>Credit 445 <span className='checkout-currency-sub'>SAR</span></p>
                            <p>Advance 100 <span className='checkout-currency-sub'>SAR</span></p>
                        </div>
                        <div className="checkout-summary-footer">
                            <div><p>Total Payable 163 <span className='checkout-currency-sub'>SAR</span></p></div>
                            <div><button className="checkout-all-btn">{t('Use this payment method')}</button></div>
                        </div>
                    </div>
                </div>
        </Sidebar>
    );
}

export default Checkout;