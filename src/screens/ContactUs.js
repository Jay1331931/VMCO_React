import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faLanguage,
  faPhone,
  faEnvelope,
  faMapMarkerAlt,
} from "@fortawesome/free-solid-svg-icons";
import { useTranslation } from "react-i18next";
import "../i18n";
import { useNavigate } from "react-router-dom";

const ContactUs = () => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";
  const navigate = useNavigate();
  const toggleLanguage = () => {
    const newLang = isRTL ? "en" : "ar";
    i18n.changeLanguage(newLang);
    document.body.dir = newLang === "ar" ? "rtl" : "ltr";
  };
  const handleNavigate = () => {
    navigate("/login",{replace:true});
  };

  return (
    <>
      {/* Header */}
      <div className={`app ${isRTL ? "rtl" : ""}`}>
        <header className="header">
          <div className="sidebar-header">
            <img
              src={
                isRTL
                  ? "/logos/talab_point_lc.png"
                  : "/logos/talab_point_en.png"
              }
              alt="Talab Point Logo"
              className="header-logo"
              style={{ maxHeight: "80%" }} // Adjust height as needed
              onClick={handleNavigate}
            />
          </div>

          <button className="lang-switch-btn" onClick={toggleLanguage}>
            <FontAwesomeIcon icon={faLanguage} />
            <span>{isRTL ? "EN" : "عربى"}</span>
          </button>
        </header>
      </div>

      {/* Contact Page */}
      <div className="contact-container">
        <h1 className="contact-title">{t("Contact Us")}</h1>

        <p className="contact-sub-title">
          {t(
            "We are here to assist you. Reach out through any of the methods below."
          )}
        </p>

        <div className="contact-grid">
          {/* Email */}
          <div className="contact-card">
            <FontAwesomeIcon icon={faEnvelope} className="contact-icon" />
            <h3>{t("Email")}</h3>
            <a href="mailto:info@vmcogulf.com" className="email-link">
              {" "}
              <p>info@vmcogulf.com</p>
            </a>
            <a href="mailto:alerts@talabpoint.com" className="email-link">
              {" "}
              <p>alerts@talabpoint.com</p>
            </a>
          </div>

          {/* Phone */}
          <div className="contact-card">
            <a href="tel:+966920007042" className="phone-link">
              <FontAwesomeIcon icon={faPhone} className="contact-icon" />
              <h3>{t("Phone")}</h3>
              <p>+966 920007042</p>
            </a>
          </div>

          {/* Address */}
          <div className="contact-card">
            <a
              href="https://www.google.com/maps?q=24.7607157,46.6929613"
              target="_blank"
              rel="noopener noreferrer"
              className="email-link"
            >
              <FontAwesomeIcon icon={faMapMarkerAlt} className="contact-icon" />
              <h3>{t("Address")}</h3>
              <p>
                {" "}
                {t(
                  "Vending machines, Imam Saud Street - Intersection of Abu Bakr Al Siddiq Road, Riyadh, Saudi Arabia"
                )}
              </p>
            </a>
          </div>
        </div>

        {/* <div className="contact-form-card">
  <h2>{t("Send us a message")}</h2>

  <form>
    <div className="form-row">
      <input type="text" placeholder={t("Your Name")} required />
      <input type="email" placeholder={t("Your Email")} required />
    </div>

    <textarea placeholder={t("Your Message")} rows="5"></textarea>

    <button type="submit" className="submit-btn">
      {t("Send Message")}
    </button>
  </form>
</div> */}
      </div>
      <style>
        {`
.contact-container {
  max-width: 900px;
  margin: auto;
  padding: 20px;
  text-align: center;
}

/* Title */
.contact-title {
  font-size: 2rem;
  font-weight: bold;
  margin-bottom: 10px;
}
.email-link,.phone-link {
  color: inherit;
  text-decoration: none;
}

.contact-sub-title {
  font-size: 1rem;
  margin-bottom: 30px;
  color: #555;
}

/* Cards Grid */
.contact-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
}

/* Contact Card */
.contact-card {
  padding: 20px;
  background: white;
  border-radius: 12px;
  box-shadow: 0px 4px 12px rgba(0,0,0,0.1);
  transition: 0.3s ease;
}

.contact-card:hover {
  transform: translateY(-5px);
  box-shadow: 0px 8px 20px rgba(0,0,0,0.15);
}

.contact-icon {
  font-size: 40px;
  margin-bottom: 10px;
  color: #009345;
}
.contact-form-card {
  margin-top: 40px;
  padding: 25px;
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0px 4px 12px rgba(0,0,0,0.1);
}

.contact-form-card h2 {
  margin-bottom: 20px;
}

/* Desktop: row for inputs */
.form-row {
  display: flex;
  gap: 15px;
  width: 100%;
  margin:10px 0px;
}

.form-row input {
  width: 100%;
}

/* All inputs */
.contact-form-card input,
.contact-form-card textarea {
  padding: 12px;
  border: 1px solid #ccc;
  border-radius: 8px;
  width: 100%;
}

/* Submit button */
.submit-btn {
  margin-top: 15px;
  padding: 12px 20px;
  background: #009345;
  color: white;
  font-size: 1rem;
  border-radius: 8px;
  cursor: pointer;
  border: none;
  transition: 0.3s;
  
}

.submit-btn:hover {
  background: #007a34;
}

/* Mobile: Stack everything column */
@media (max-width: 600px) {
  .form-row {
    flex-direction: column;
  }
    .contact-container {
   
    padding: 20% 9%;
        }
}


/* RTL Support */
.rtl .contact-container {
  direction: rtl;
}


`}
      </style>
    </>
  );
};

export default ContactUs;
