import React, { useState, useEffect } from 'react';
import '../i18n';
import { useTranslation } from 'react-i18next';
import { useNavigate, useLocation } from 'react-router-dom';

function Login({ title }) {
    const { t } = useTranslation();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        document.title = t('Login');
    }, [t]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (username === '' || password === '') {
            setError(t('Please fill in all fields'));
        } else {
            // Handle login logic here
            console.log('Logging in with:', { username, password });
            setError('');
        }
    };

    const handleForgotPassword = (e) => {
        e.preventDefault();
        navigate('/forgot-password');
    };

    return (
        <div className='login-screen'>
            {title === 'Customer Login' ?
            (<div className='login-screen-text'>
                <p>{t('Thank you for completing the invitation.')}</p>
                <p>{t('Please Login to provide further details')}</p>
                </div>) : []}
            
            <div className='login-component'>
            <div className="login-header">{t('Login')}</div>
                <div className="login-container">
                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label htmlFor="username">{t('Email (Username)')}</label>
                            <input
                                type="text"
                                id="username"
                                value={username}
                                placeholder={t('Email (Username)')}
                                onChange={(e) => setUsername(e.target.value)}
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
                        {error && <p className="error-message">{error}</p>}

                    </form>
                </div>
                <div className='login-footer'>
                    {title === 'Customer Login' ? 
                    (<div className="login-footer-text">
                    <a href="#" onClick={handleForgotPassword}>{t('Forgot Password?')}</a>
                    <a href="#">|{t('Register')}</a>
                    </div>) :
                    (<div className="login-footer-text">
                    <a href="#" onClick={handleForgotPassword}>{t('Forgot Password?')}</a>
                    </div>)
                    }
                    <div><button type="submit" className="login-button">{t('Sign In')}</button></div>
                </div>

            </div>
        </div>
    );
}

export default Login;
