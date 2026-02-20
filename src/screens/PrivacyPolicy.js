import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faLanguage } from "@fortawesome/free-solid-svg-icons";
import "../i18n";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

const PrivacyPolicy = () => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";
  const navigate = useNavigate();
  const toggleLanguage = () => {
    const newLang = isRTL ? "en" : "ar";
    i18n.changeLanguage(newLang);
    document.body.dir = newLang === "ar" ? "rtl" : "ltr";
  };
  const handleNavigate =()=>{
navigate("/login")
  }

  return (
    <>
      {/* HEADER */}
       <div className={`app ${isRTL ? 'rtl' : ''}`}>
        <header className="header">
          <div className="sidebar-header">
            <img
              src={isRTL ? '/logos/talab_point_lc.png' : '/logos/talab_point_en.png'}
              alt="Talab Point Logo"
              className="header-logo"
              style={{ maxHeight: '80%' }} // Adjust height as needed
              onClick={handleNavigate}
            />
          </div>
          <button className="lang-switch-btn" onClick={toggleLanguage}>
            <FontAwesomeIcon icon={faLanguage} />
            <span>{isRTL ? 'EN' : 'عربى'}</span>
          </button>
        </header>
      </div>

      {/* PRIVACY POLICY CONTENT */}
    <div className="privacy-wrapper">
  <div className="privacy-card">
    <h1 className="policy-title">{t("TALAB POINT – PRIVACY POLICY")}</h1>

    <p className="meta-dates">
      {t("Effective Date: 01 October 2025 | Last Updated: 23 November 2025")}
    </p>

    <div className="policy-content">

      {/* 1 */}
      <section>
        <h2>{t("1. Mandatory Provision of Information and Documents")}</h2>
        <p>
          {t("1.1 You agree that all information and documents requested by Talab Point (including but not limited to Commercial Registration, VAT certificate, National ID/Iqama, authorised signatory details, bank account information, or any other regulatory or operational document) are mandatory for account activation, order processing, delivery, and settlement.")}
        </p>
        <p>
          {t("1.2 Refusal or failure to provide accurate and complete documents when requested constitutes a material breach entitling Talab Point to immediately suspend or terminate your account and refuse fulfilment of any pending orders without liability.")}
        </p>
      </section>

      {/* 2 */}
      <section>
        <h2>{t("2. Irrevocable Custom/Manufactured/Special Orders")}</h2>
        <p>{t("2.1 Once a custom, made-to-order, specially manufactured, configured, or personalised item enters production or procurement, the order becomes irrevocable and non-cancellable.")}</p>
        <p>{t("2.2 You remain fully liable for the entire price and all associated costs even if you subsequently attempt to cancel or refuse acceptance.")}</p>
      </section>

      {/* 3 */}
      <section>
        <h2>{t("3. Obligation to Accept Delivery")}</h2>
        <p>{t("3.1 You must accept delivery of goods within the timeframe communicated by Talab Point or its logistics partners.")}</p>
        <p>{t("3.2 Failure to accept delivery may result in:")}</p>

        <ul>
          <li>{t("(a) storage fees;")}</li>
          <li>{t("(b) redelivery fees;")}</li>
          <li>{t("(c) disposal or resale;")}</li>
          <li>{t("(d) recovery of full order value.")}</li>
        </ul>

        <p>{t("3.3 All additional fees will be calculated at prevailing commercial rates.")}</p>
      </section>

      {/* 4 */}
      <section>
        <h2>{t("4. Force Majeure")}</h2>
        <p>{t("Talab Point shall not be liable for failure in performance due to circumstances beyond reasonable control such as war, pandemics, fire, floods, strikes, or regulatory changes.")}</p>
      </section>

      {/* 5 */}
      <section>
        <h2>{t("5. Limitation of Liability")}</h2>
        <p>{t("5.1 Talab Point is not liable for any indirect, special, or consequential damages.")}</p>
        <p>{t("5.2 Talab Point is not liable for loss arising due to misuse of the platform or incorrect customer information.")}</p>
      </section>

      {/* 6 */}
      <section>
        <h2>{t("6. Suspension and Termination for Non-Compliance")}</h2>
        <p>{t("Talab Point may suspend or terminate your account immediately without compensation if you breach these terms.")}</p>
      </section>

      {/* 7 */}
      <section>
        <h2>{t("7. Governing Law and Dispute Resolution")}</h2>
        <p>{t("7.1 These Terms are governed by the laws of the Kingdom of Saudi Arabia.")}</p>
        <p>{t("7.2 Disputes will be handled by courts in Riyadh or the SCCA arbitration process.")}</p>
      </section>

      {/* 8 */}
      <section>
        <h2>{t("8. General Provisions")}</h2>
        <p>{t("8.1 These Terms constitute the entire agreement.")}</p>
        <p>{t("8.2 Invalid provisions will not affect the remaining Terms.")}</p>
        <p>{t("8.3 Continued use of the platform means acceptance of updated Terms.")}</p>
        
      </section>

    </div>
  </div>
</div>



      <style>
        {
            `
.lang-switch-btn {
  margin-left: auto;
  background: none;
  border: 1px solid var(--border-color);
  border-radius: 6px;
//   padding: 35px;
  font-size: 0.85rem;
  color: var(--text-secondary);
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  transition: background-color 0.2s ease;
}
.lang-switch-btn:hover {
  background-color: var(--border-color);
}

/* Main Card */
.privacy-wrapper {
  display: flex;
  justify-content: center;
  align-items:center;
  padding: 30px 15px;
}

.privacy-card {
  max-width: 950px;
  padding: 35px;
  background: #fff;
  border-radius: 14px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.08);
}

.policy-title {
  font-size: 28px;
  text-align: center;
  margin-bottom: 6px;
  color: #009345;
}

.meta-dates {
  text-align: center;
  color: #666;
  margin-bottom: 30px;
}

/* Sections */
.policy-content h2 {
  color: #009345;
  margin-top: 25px;
  margin-bottom: 10px;
  font-size: 20px;
}

.policy-content p {
  font-size: 16px;
  line-height: 1.8;
  color: #333;
}

.policy-content ul {
  margin-left: 20px;
  line-height: 1.7;
}

@media (max-width: 600px) {
  .privacy-card {
    padding: 41px 20px;
  }

  .policy-title {
    font-size: 22px;
  }

  .policy-content p {
    font-size: 15px;
  }
}
`
        }
      </style>
    </>
  );
};

export default PrivacyPolicy;
