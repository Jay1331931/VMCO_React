import React from "react";
import { useTranslation } from "react-i18next";
import "../../styles/forms.css";

function Documents({ isTrading = true }) {
  const { t } = useTranslation();

  return (
    <div className="customer-onboarding-form-grid">
      {/* Documents Header */}
      <div className="form-header full-width">{t("Documents")}</div>
      <div className="form-group" />
      <div className="form-header full-width">
        {t("Download terms & conditions and upload duly signed document")}
      </div>

      {/* Common Fields */}
      <div className="form-group file-upload">
        <label htmlFor="acknowledgementSignature">
          {t("Upload duly signed document")}
          <span className="required-field">*</span>
        </label>
        <input
          type="file"
          id="acknowledgementSignature"
          name="acknowledgementSignature"
          className="text-field small"
          required
        />
      </div>

      {isTrading ? (
        <>
          <div className="form-group file-upload">
            <label htmlFor="crCertificate">
              {t("Copy of Commercial Registration")}
              <span className="required-field">*</span>
            </label>
            <input
              type="file"
              id="crCertificate"
              name="crCertificate"
              className="text-field small"
              required
            />
          </div>
          <div className="form-group file-upload">
            <label htmlFor="vatCertificate">
              {t("Copy of VAT Certificate")}
              <span className="required-field">*</span>
            </label>
            <input
              type="file"
              id="vatCertificate"
              name="vatCertificate"
              className="text-field small"
              required
            />
          </div>
          <div className="form-group file-upload">
            <label htmlFor="nationalId">
              {t("Copy of national ID/Iqama of the auth. sign..")}
              <span className="required-field">*</span>
            </label>
            <input
              type="file"
              id="nationalId"
              name="nationalId"
              className="text-field small"
              required
            />
          </div>
          <div className="form-group file-upload">
            <label htmlFor="bankLetter">
              {t("Bank details on company letterhead")}
              <span className="required-field">*</span>
            </label>
            <input
              type="file"
              id="bankLetter"
              name="bankLetter"
              className="text-field small"
              required
            />
          </div>
          <div className="form-group file-upload">
            <label htmlFor="nationalAddress">
              {t("Copy of National Address")}
              <span className="required-field">*</span>
            </label>
            <input
              type="file"
              id="nationalAddress"
              name="nationalAddress"
              className="text-field small"
              required
            />
          </div>
          <div className="form-group file-upload">
            <label htmlFor="contractAgreement">
              {t("Contract Agreement")}
              <span className="required-field">*</span>
            </label>
            <input
              type="file"
              id="contractAgreement"
              name="contractAgreement"
              className="text-field small"
              required
            />
          </div>
          <div className="form-group file-upload">
            <label htmlFor="creditApplication">
              {t("Credit Application")}
              <span className="required-field">*</span>
            </label>
            <input
              type="file"
              id="creditApplication"
              name="creditApplication"
              className="text-field small"
              required
            />
          </div>
        </>
      ) : (
        <>
          <div className="form-group file-upload">
            <label htmlFor="contractAgreement">
              {t("Contract Agreement")}
              <span className="required-field">*</span>
            </label>
            <input
              type="file"
              id="contractAgreement"
              name="contractAgreement"
              className="text-field small"
              required
            />
          </div>
          <div className="form-group file-upload">
            <label htmlFor="creditApplication">
              {t("Credit Application")}
              <span className="required-field">*</span>
            </label>
            <input
              type="file"
              id="creditApplication"
              name="creditApplication"
              className="text-field small"
              required
            />
          </div>
          <div className="form-group file-upload">
            <label htmlFor="nonTradingDocuments">
              {t("Non-Trading Documents")}
              <span style={{ color: "#aaa", marginLeft: 4 }}>
                ({t("Upload additional documents for non-trading companies")})
              </span>
            </label>
            <input
              type="file"
              id="nonTradingDocuments"
              name="nonTradingDocuments"
              className="text-field small"
              multiple
              accept=".pdf,.doc,.docx,.jpg,.png"
            />
          </div>
        </>
      )}
    </div>
  );
}

export default Documents;