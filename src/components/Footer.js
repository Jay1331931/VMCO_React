import React from "react";
import "../i18n";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
const Footer = () => {
      const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";

    const handlefooter =(pathname)=>{
navigate(`/${pathname}`)
  }

  return (
    <div className={`footer-container ${isRTL ? "rtl" : ""}`}>
      <div className="login-bottom-footer">
        {t("© TalabPoint. All rights reserved. Please read our") } 
        <a  className="footer-link" onClick={()=>handlefooter('privacy-policy')}>
          {" " + t("Privacy Policy")}
        </a> {t("to learn more about the way we use your information.")}
        {/* <span> | </span> */}
       {" "}

<a  className="footer-link" onClick={()=>handlefooter('contact-us')}>
  {t("Contact Us")}
</a>
{" "}
{t("for any support.")}
        {/* <p>
          {t(
            "© TalabPoint. All rights reserved. Use of this platform constitutes acceptance of the Terms and Conditions. Governed by the laws of the Kingdom of Saudi Arabia."
          )}
        </p> */}
      </div>

      <style>
        {`
        .footer-container{
        margin:10px 0px;
        }
  .login-bottom-footer {
    margin: 25px;
    text-align: center;
    font-size: 14px;
    color: #666;
  }
  
  .login-bottom-footer .footer-link {
     color: #00205B;
    text-decoration: none;
  }
    p{
        color: #00205B;
        margin:10px 0px;
    }

  .login-bottom-footer .footer-link:hover {
    text-decoration: underline;
  }
`}
      </style>
    </div>
  );
};
export default Footer;
