import Login from '../components/Login';
import Sidebar from '../components/Sidebar';
import { useTranslation } from 'react-i18next';
import { useEffect } from 'react';

function LoginScreen() {
    const { t } = useTranslation();
    
    useEffect(() => {
        document.title = t('Login');
    }, [t]);
    
    return (
        <Sidebar>
        <div className="login-screen">
        <Login title={t('Login')} />
        </div>
        </Sidebar>
    );
    }
export default LoginScreen;