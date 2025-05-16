import Login from '../components/Login';
import Sidebar from '../components/Sidebar';
import { useTranslation } from 'react-i18next';
import { useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import '../i18n';
import {faLanguage, faLocationDot} from '@fortawesome/free-solid-svg-icons';
import { useLocation } from 'react-router-dom';

function LoginScreen() {
    const { t, i18n } = useTranslation();
    const location = useLocation();
    useEffect(() => {
        document.title = t('Login');
    }, [t]);
    const isRTL = i18n.language === 'ar';
const path = location.pathname;
  const isCustomerLogin = path === '/login';

  const title = isCustomerLogin ? t('Customer Login') : t('Employee Login');
  const userType = isCustomerLogin ? 'customer' : null;

  const toggleLanguage = () => {
    const newLang = isRTL ? 'en' : 'ar';
    i18n.changeLanguage(newLang);
    document.body.dir = newLang === 'ar' ? 'rtl' : 'ltr';
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
            
        
        <Login title={title} userType = {userType} />
        
        </div>
    );
    }
export default LoginScreen;