import Login from '../components/Login';
import { useTranslation } from 'react-i18next';
import { useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import '../i18n';
import { faLanguage } from '@fortawesome/free-solid-svg-icons';
import { useLocation, useNavigate } from 'react-router-dom';
import Footer from '../components/Footer';



function LoginScreen() {
  const { t, i18n } = useTranslation();
  const location = useLocation();
    const navigate = useNavigate();
  useEffect(() => {
    document.title = t('Login');
  }, [t]);

  const isRTL = i18n.language === 'ar';
  const path = location.pathname;
  const isCustomerLogin = path === '/login' || path === '/';

  const title = isCustomerLogin ? t('Customer Login') : t('Employee Login');
  const userType = isCustomerLogin ? 'customer' : null;
 
  const toggleLanguage = () => {
    const newLang = isRTL ? 'en' : 'ar';
    i18n.changeLanguage(newLang);
    document.body.dir = newLang === 'ar' ? 'rtl' : 'ltr';
  };
  return (
  <div className="page-container">
      <div className={`app ${isRTL ? 'rtl' : ''}`}>
        <header className="header">
          <div className="sidebar-header">
            <img
              src={isRTL ? '/logos/talab_point_lc.png' : '/logos/talab_point_en.png'}
              alt="Talab Point Logo"
              className="header-logo"
              style={{ maxHeight: '80%' }} // Adjust height as needed
            />
          </div>
          <button className="lang-switch-btn" onClick={toggleLanguage}>
            <FontAwesomeIcon icon={faLanguage} />
            <span>{isRTL ? 'EN' : 'عربى'}</span>
          </button>
        </header>
      </div>


  <div className="content-wrap">


      <Login title={title} userType={userType} />
      </div>
 <Footer/>


 <style>
  {`html, body, #root {
  height: 100%;
  margin: 0;
  padding: 0;
}

.page-container {
  min-height: 100%;
  display: flex;
  flex-direction: column;
}

.content-wrap {
  flex: 1;
}
`}
 </style>
    </div>
  );
}
export default LoginScreen;