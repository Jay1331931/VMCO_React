import React, { useState, useEffect } from 'react';
import '../i18n';
import { useTranslation } from 'react-i18next';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function Login({ title, userType }) {
    const { login } = useAuth();
    const { t } = useTranslation();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');

    const navigate = useNavigate();
    const API_SERVER_URL = process.env.REACT_APP_API_BASE_URL;
    useEffect(() => {
        document.title = t('Login');
    }, [t]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (email === '' || password === '') {
            setError(t('Please fill in all fields'));
        } else {
            // Handle login logic here
            try {
                const requestBody = {
            email,
            password,
            ...(title === 'Customer Login' && { user_type: 'customer' })  // 👈 Conditional addition
        };
        // const res = await fetch('https://vmcoservertest-cyf3gyg4hpb9h7ek.southindia-01.azurewebsites.net/api/user/email-password', {
        const res = await fetch(`${API_SERVER_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody),
            credentials: 'include',
        });

        const data = await res.json();

        console.log('Login response:', data);
        const cookie = getCookie('token');
        console.log('Cookie:', cookie);

        login(cookie, data.data);

        if (!res.ok) {
            // setError(data.message || 'Login failed');
            setError('Email or password is invalid')
            return;
        }
        if(data?.data?.customerStatus === "new") {
            navigate('/customerDetails', { state: { customerId: data?.data?.customerId, mode: 'add' } });
        } else {
            navigate('/catalog');
        }

        setMessage(data.message);
        setError('');

    } catch (error) {
        console.error('Login error:', error);
        setError('Unable to connect to server');
    }
            setError('');
        }
    };

const getCookie = (name) => {
  const cookies = document.cookie
    .split(';')
    .map(cookie => cookie.trim())
    .reduce((acc, cookie) => {
      const [key, value] = cookie.split('=');
      acc[key] = decodeURIComponent(value);
      return acc;
    }, {});
    
  return cookies[name] || null;
};

    const handleForgotPassword = (e) => {
        e.preventDefault();
        navigate('/forgotPassword', { state: { email } }); // Pass email as state
    };

    const handleRegister = (e) => {
        e.preventDefault();
        navigate('/customers/registration');
    };
    return (
        <div className='login-screen'>
            {/* {title === 'Customer Login' ?
                (<div className='login-screen-text'>
                    <p>{t('Thank you for completing the invitation.')}</p>
                    <p>{t('Please Login to provide further details')}</p>
                </div>) : []} */}

            <div className='login-component'>
                <div className="login-header">{t('Login')}</div>
                <div className="login-container">
                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label htmlFor="email">{t('Email (email)')}</label>
                            <input
                                type="text"
                                id="email"
                                value={email}
                                placeholder={t('Email (email)')}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="password">{t('Password')}</label>
                            <input
                                type="password"
                                id="password"
                                value={password}
                                placeholder={t('Password')}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>
                        {error && <p className="error-message">{t(error)}</p>}

                    </form>
                </div>
                <div className='login-footer'>
                    {title === 'Customer Login' ?
                        (<div className="login-footer-text">
                            <a href="#" onClick={handleForgotPassword}>{t('Forgot Password?')}</a>
                            <span> | </span>
                            <a href="#" onClick={handleRegister}>{t('Register')}</a>
                        </div>) :
                        (<div className="login-footer-text">
                            <a href="#" onClick={handleForgotPassword}>{t('Forgot Password?')}</a>
                        </div>)
                    }
                    <div><button type="submit" className="login-button" onClick={handleSubmit}>{t('Sign In')}</button></div>
                </div>

            </div>
            <style>
                {`
                input:focus {
                    outline: none;
                }
                `}
            </style>
        </div>
    );
}

export default Login;
