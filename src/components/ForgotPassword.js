
import React, { useState, useEffect } from 'react';
import '../styles/components.css';
import '../i18n';
import { useTranslation } from 'react-i18next';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useNavigate, useLocation } from 'react-router-dom';
import { faLanguage, faLocationDot } from '@fortawesome/free-solid-svg-icons';

function Login() {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const { t, i18n } = useTranslation();
    const isRTL = i18n.language === 'ar';

    const toggleLanguage = () => {
        const newLang = isRTL ? 'en' : 'ar';
        i18n.changeLanguage(newLang);
        document.body.dir = newLang === 'ar' ? 'rtl' : 'ltr';
    };


    const handleSubmit = (e) => {
        e.preventDefault();
        if (password === '' || password === '') {
            setError(t('Please fill in all fields'));
        } else {
            // Handle login logic here
            setError('');
        }
    };



    return (
        <div>
            <div className={`app ${isRTL ? 'rtl' : ''}`}>
                <header className='header'>
                    <div className="sidebar-header">
                        <FontAwesomeIcon icon={faLocationDot} size="xl" />
                        <h1>{t('Talab Point')}</h1>
                    </div>
                    <button className="lang-switch-btn" onClick={toggleLanguage}>
                        <FontAwesomeIcon icon={faLanguage} />
                        <span>{isRTL ? 'EN' : 'عربى'}</span>
                    </button>
                </header>
            </div>
            <div className='login-screen'>
                <div className='login-component'>
                    <div className="login-header"></div>
                    <div className="login-container">
                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label htmlFor="username">{t('Password')}</label>
                                <input
                                    type="password"
                                    id="password"
                                    value={password}
                                    placeholder={t('Password')}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="password">{t('Confirm Password')}</label>
                                <input
                                    type="password"
                                    id="confirmpassword"
                                    value={confirmPassword}
                                    placeholder={t('Confirm Password')}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                />
                            </div>
                            {error && <p className="error-message">{error}</p>}

                        </form>
                    </div>
                    <div className='onboarding-footer'>

                        <div><button type="submit" className="login-button">{t('Confirm')}</button></div>
                    </div>

                </div>
            </div>
        </div>
    );
}

export default Login;
