import React, { useEffect } from 'react';
import '../i18n';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

function Logout() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const API_SERVER_URL = process.env.REACT_APP_API_BASE_URL;

    useEffect(() => {
        const logoutUser = async () => {
            try {
                const res = await fetch(`${API_SERVER_URL}/auth/logout`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                });

                if (!res.ok) {
                    const data = await res.json();
                    console.error('Logout failed:', data.message || 'Unknown error');
                    navigate('/login'); // Still redirect even if logout failed
                    return;
                }

                // Clear client-side storage if needed
                localStorage.removeItem('authToken');
                sessionStorage.removeItem('userData');

                // Redirect to login page after successful logout
                navigate('/login');

            } catch (error) {
                console.error('Logout error:', error);
            }
        };

        logoutUser();

        // Cleanup function (optional)
        return () => {
            // Cancel any pending requests if needed
        };
    }, [navigate, API_SERVER_URL, t]);

    return (
        <div className="logout-container">
            <p>{t('logging_out')}</p>
            {/* You could add a loading spinner here */}
        </div>
    );
}

export default Logout;