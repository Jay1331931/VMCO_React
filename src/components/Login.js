
import React, { useState, useEffect } from 'react';
import '../styles/components.css';
import '../i18n';
import { useTranslation } from 'react-i18next';

function Login({ title }) {
    const { t } = useTranslation();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

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

    return (
        <div className='login-component'>
            <div className="login-header">{title}</div>
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
        <a href="#">{t('Forgot Password?')}</a>
        <button type="submit" className="login-button">{t('Sign In')}</button>
    </div>

        </div>

    );
}

export default Login;
