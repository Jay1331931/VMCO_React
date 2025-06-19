import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { fetchDropdownFromBasicsMaster } from "../../utilities/commonServices";
import "../../styles/forms.css";

function FinancialInformation({
  customerData = {},
  customerPaymentMethodsData = {},
  onChangeCustomerPaymentMethodsData,
  onChangeCustomerData
}) {
  const { t } = useTranslation();
  const [isDeliveryChargesApplicable, setIsDeliveryChargesApplicable] =
    useState(false);
  const [prePayment, setPrePayment] = useState(
    customerPaymentMethodsData?.methodDetails?.prePayment?.isAllowed || false
  );
  const [partialPayment, setPartialPayment] = useState(
    customerPaymentMethodsData?.methodDetails?.partialPayment?.isAllowed ||
      false
  );
  const [COD, setCOD] = useState(
    customerPaymentMethodsData?.methodDetails?.COD?.isAllowed || false
  );
  const [credit, setCredit] = useState(
    customerPaymentMethodsData?.methodDetails?.credit?.isAllowed || false
  );
  const [paymentMethods, setPaymentMethods] = useState(
    customerPaymentMethodsData?.methodDetails || {}
  );
  // Dropdown state for pricingPolicy
  const dropdownFields = ["pricingPolicy"];
  const [basicMasterLists, setBasicMasterLists] = useState({});

  useEffect(() => {
    const fetchData = async () => {
      const listOfBasicsMaster = await fetchDropdownFromBasicsMaster(
        dropdownFields
      );
      setBasicMasterLists(listOfBasicsMaster);
    };
    fetchData();
  }, []);

  return (
    <div className="customer-onboarding-form-grid">
      {/* Bank Details Header */}
      <div className="form-header full-width">{t("Bank Details")}</div>
      <div className="form-group">
        <label htmlFor="bankName">
          {t("Bank Name")}
          <span className="required-field">*</span>
        </label>
        <input
          type="text"
          id="bankName"
          name="bankName"
          className="text-field small"
          placeholder={t("Enter bank name")}
          value={customerData?.bankName}
          onChange={onChangeCustomerData}
          required
        />
      </div>
      <div className="form-group">
        <label htmlFor="bankAccountNumber">
          {t("Account Number")}
          <span className="required-field">*</span>
        </label>
        <input
          type="text"
          id="bankAccountNumber"
          name="bankAccountNumber"
          className="text-field small"
          placeholder={t("Enter account number")}
          value={customerData?.bankAccountNumber}
          onChange={onChangeCustomerData}
          required
        />
      </div>
      <div className="form-group">
        <label htmlFor="iban">
          {t("IBAN")}
          <span className="required-field">*</span>
        </label>
        <input
          type="text"
          id="iban"
          name="iban"
          className="text-field small"
          placeholder={t("Enter IBAN")}
          value={customerData?.iban}
          onChange={onChangeCustomerData}
          required
        />
      </div>
      <div className="form-group" />

      {/* Price Plan */}
      <div className="form-group">
        <label htmlFor="pricingPolicy">{t("Price Plan")}</label>
        <select id="pricingPolicy" name="pricingPolicy" className="dropdown">
          <option value="" disabled>
            {t("Select")}
          </option>
          {basicMasterLists?.pricingPolicy?.length ? (
            basicMasterLists.pricingPolicy.map((policy) => (
              <option key={policy} value={policy}>
                {t(policy)}
              </option>
            ))
          ) : (
            <>
              <option value="Price A">{t("Price A")}</option>
              <option value="Price B">{t("Price B")}</option>
              <option value="Price C">{t("Price C")}</option>
            </>
          )}
        </select>
      </div>
      <div className="form-group" />

      {/* Delivery Charges Applicable */}
      <div className="form-group">
        <label className="checkbox-group-label">
          <input
            type="checkbox"
            id="isDeliveryChargesApplicable"
            name="isDeliveryChargesApplicable"
            checked={isDeliveryChargesApplicable}
            onChange={(e) => setIsDeliveryChargesApplicable(e.target.checked)}
          />
          {t("Is delivery charges applicable")}
        </label>
      </div>

      {/* Payment Methods Header (empty for spacing) */}
      <div className="form-header full-width"></div>

      {/* Payment Methods */}
      <div className="form-group">
        <label className="hidden-label" htmlFor="prePayment">
          {t("Payment Methods")}
        </label>
        <label className="checkbox-group-label">
          <input
            type="checkbox"
            id="prePayment"
            name="prePayment"
            checked={paymentMethods?.prePayment?.isAllowed}
            onChange={onChangeCustomerPaymentMethodsData}
          />
          {t("Pre-Payment")}
        </label>
      </div>
      <div className="form-group" />

      <div className="form-group">
        <label className="checkbox-group-label">
          <input
            type="checkbox"
            id="partialPayment"
            name="partialPayment"
            checked={paymentMethods?.partialPayment?.isAllowed}
            onChange={onChangeCustomerPaymentMethodsData}
          />
          {t("Partial Payment")}
        </label>
      </div>
      <div className="form-group" />

      <div className="form-group">
        <label className="checkbox-group-label">
          <input
            type="checkbox"
            id="COD"
            name="COD"
            checked={paymentMethods?.COD?.isAllowed}
            onChange={onChangeCustomerPaymentMethodsData}
          />
          {t("Cash on Delivery (COD)")}
        </label>
      </div>
      <div className="form-group">
        {customerPaymentMethodsData?.methodDetails?.COD?.isAllowed && (
          <>
            <label htmlFor="creditLimit">{t("COD Limit")}</label>
            <input
              type="text"
              id="CODLimit"
              name="CODLimit"
              className="text-field small"
              placeholder={t("Enter COD limit")}
              value={customerPaymentMethodsData?.methodDetails?.COD?.limit || ""}
              onChange={onChangeCustomerPaymentMethodsData}
            />
          </>
        )}
      </div>
      

      <div className="form-group">
        <label className="checkbox-group-label">
          <input
            type="checkbox"
            id="credit"
            name="credit"
            checked={paymentMethods?.credit?.isAllowed}
            onChange={onChangeCustomerPaymentMethodsData}
          />
          {t("Credit")}
        </label>
      </div>
      <div className="form-group">
        {customerPaymentMethodsData?.methodDetails?.credit?.isAllowed && (
          <>
            <label htmlFor="creditLimit">{t("Credit Limit")}</label>
            <input
              type="text"
              id="creditLimit"
              name="creditLimit"
              className="text-field small"
              placeholder={t("Enter credit limit")}
              value={customerPaymentMethodsData?.methodDetails?.credit?.limit || ""}
              onChange={onChangeCustomerPaymentMethodsData}
            />
          </>
        )}
      </div>
      <div className="form-group" />

      <div className="form-group">
        {customerPaymentMethodsData?.methodDetails?.credit?.isAllowed && (
          <>
            <label htmlFor="creditPeriod">{t("Credit Period")}</label>
            <input
              type="text"
              id="creditPeriod"
              name="creditPeriod"
              className="text-field small"
              placeholder={t("Enter credit period")}
              value={
                customerPaymentMethodsData?.methodDetails?.credit?.period || ""
              }
              onChange={onChangeCustomerPaymentMethodsData}
            />
          </>
        )}
      </div>
    </div>
  );
}

export default FinancialInformation;
