import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { fetchDropdownFromBasicsMaster } from "../../utilities/commonServices";
import "../../styles/forms.css";
import Constants from "../../constants";
import RbacManager from "../../utilities/rbac";
import { useAuth } from "../../context/AuthContext";
const CUSTOMER_APPROVAL_CHECKLIST_URL =
  process.env.REACT_APP_CUSTOMER_APPROVAL_CHECKLIST_URL;
function FinancialInformation({
  customerData = {},
  originalCustomerData = {},
  customerPaymentMethodsData = {},
  originalCustomerPaymentMethodsData = {},
  onChangeCustomerPaymentMethodsData,
  onChangeCustomerData,
  setEntityWisePricePlan,
  setCustomerCreditChange,
  setIsDeliveryChargesApplicable,
  mode,
  setTabsHeight,
  formErrors = {},
}) {
  const { t } = useTranslation();
  const { token, user, isAuthenticated, logout, loading } = useAuth();

  const rbacMgr = new RbacManager(
    user?.userType == "employee" && user?.roles[0] !== "admin"
      ? user?.designation
      : user?.roles[0],
    mode === "add" || customerData?.customerStatus === "new"
      ? "custDetailsAdd"
      : "custDetailsEdit"
  );
  console.log("RBAC Manager:", rbacMgr);

  const isV = rbacMgr.isV.bind(rbacMgr);
  const isE = rbacMgr.isE.bind(rbacMgr);
  // const [isDeliveryChargesApplicable, setIsDeliveryChargesApplicable] =
  //   useState(false);
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
    setTabsHeight("auto");
  }, []);

  return (
    <div className="customer-onboarding-form-grid">
      {isV("customerApprovalChecklist") && (
        <div className="form-main-header">
          <a
            href={CUSTOMER_APPROVAL_CHECKLIST_URL}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => {
              if (!CUSTOMER_APPROVAL_CHECKLIST_URL) {
                e.preventDefault();
                alert(t("No checklist URL configured."));
              }
            }}
          >
            {t("Customer Approval Checklist")}
          </a>
        </div>
      )}
      {/* Bank Details Header */}
      <h3 className="form-header full-width">{t("Bank Details")}</h3>
      <div className="form-group">
        <label htmlFor="bankName">
          {t("Bank Name")}
          <span className="required-field">*</span>
          {originalCustomerData &&
            customerData &&
            originalCustomerData?.bankName != customerData?.bankName &&
            mode === "edit" && (
              <span className="update-badge">{t("Updated")}</span>
            )}
        </label>
        <input
          type="text"
          id="bankName"
          name="bankName"
          className={`text-field small ${
            originalCustomerData &&
            customerData &&
            originalCustomerData?.bankName != customerData?.bankName &&
            mode === "edit"
              ? "update-field"
              : ""
          }`}
          placeholder={t("Enter bank name")}
          value={customerData?.bankName || ""}
          onChange={onChangeCustomerData}
          disabled={
            originalCustomerData &&
            customerData &&
            originalCustomerData?.bankName === customerData?.bankName &&
            mode === "edit" &&
            customerData?.customerStatus !== "pending"
          }
          required
        />
        {originalCustomerData &&
          customerData &&
          originalCustomerData?.bankName != customerData?.bankName &&
          mode === "edit" && (
            <div className="current-value">
              Previous: {originalCustomerData?.bankName || "(empty)"}
            </div>
          )}
        {formErrors.bankName && (
          <div className="error">{formErrors.bankName}</div>
        )}
      </div>

      <div className="form-group">
        <label htmlFor="bankAccountNumber">
          {t("Account Number")}
          <span className="required-field">*</span>
          {originalCustomerData &&
            customerData &&
            originalCustomerData?.bankAccountNumber !=
              customerData?.bankAccountNumber &&
            mode === "edit" && (
              <span className="update-badge">{t("Updated")}</span>
            )}
        </label>
        <input
          type="text"
          id="bankAccountNumber"
          name="bankAccountNumber"
          className={`text-field small ${
            originalCustomerData &&
            customerData &&
            originalCustomerData?.bankAccountNumber !=
              customerData?.bankAccountNumber &&
            mode === "edit"
              ? "update-field"
              : ""
          }`}
          placeholder={t("Enter account number")}
          value={customerData?.bankAccountNumber || ""}
          onChange={onChangeCustomerData}
          disabled={
            originalCustomerData &&
            customerData &&
            originalCustomerData?.bankAccountNumber ===
              customerData?.bankAccountNumber &&
            mode === "edit" &&
            customerData?.customerStatus !== "pending"
          }
          required
        />
        {originalCustomerData &&
          customerData &&
          originalCustomerData?.bankAccountNumber !=
            customerData?.bankAccountNumber &&
          mode === "edit" && (
            <div className="current-value">
              Previous: {originalCustomerData?.bankAccountNumber || "(empty)"}
            </div>
          )}
        {formErrors.bankAccountNumber && (
          <div className="error">{formErrors.bankAccountNumber}</div>
        )}
      </div>

      <div className="form-group">
        <label htmlFor="iban">
          {t("IBAN")}
          <span className="required-field">*</span>
          {originalCustomerData &&
            customerData &&
            originalCustomerData?.iban != customerData?.iban &&
            mode === "edit" && (
              <span className="update-badge">{t("Updated")}</span>
            )}
        </label>
        <input
          type="text"
          id="iban"
          name="iban"
          className={`text-field small ${
            originalCustomerData &&
            customerData &&
            originalCustomerData?.iban != customerData?.iban &&
            mode === "edit"
              ? "update-field"
              : ""
          }`}
          placeholder={t("Enter IBAN")}
          value={customerData?.iban || ""}
          onChange={onChangeCustomerData}
          disabled={
            originalCustomerData &&
            customerData &&
            originalCustomerData?.iban === customerData?.iban &&
            mode === "edit" &&
            customerData?.customerStatus !== "pending"
          }
          required
        />
        {originalCustomerData &&
          customerData &&
          originalCustomerData?.iban != customerData?.iban &&
          mode === "edit" && (
            <div className="current-value">
              Previous: {originalCustomerData?.iban || "(empty)"}
            </div>
          )}
        {formErrors.iban && <div className="error">{formErrors.iban}</div>}
      </div>
      <div className="form-group" />

      {isV("assignedToEntityWise") && (
        <>
          {/* Entity Wise Price Plan Assignment Header */}
          <h3 className="form-header full-width">{t("Pricing Plan")}</h3>
          {/* Entity Wise Price Plan Assignment */}
          <div className="form-group">
            <label htmlFor="pricingPolicy">
              {t(Constants.ENTITY.DAR)}
              {originalCustomerData &&
                customerData &&
                originalCustomerData?.pricingPolicy?.[Constants.ENTITY.DAR] !==
                  customerData?.pricingPolicy?.[Constants.ENTITY.DAR] &&
                mode === "edit" && (
                  <span className="update-badge">{t("Updated")}</span>
                )}
            </label>
            <select
              id="pricingPolicy"
              name={[Constants.ENTITY.DAR]}
              className={`dropdown ${
                originalCustomerData &&
                customerData &&
                originalCustomerData?.pricingPolicy?.[Constants.ENTITY.DAR] !==
                  customerData?.pricingPolicy?.[Constants.ENTITY.DAR] &&
                mode === "edit"
                  ? "update-field"
                  : ""
              }`}
              value={customerData?.pricingPolicy?.[Constants.ENTITY.DAR] || ""}
              onChange={setEntityWisePricePlan}
              disabled={
                originalCustomerData &&
                customerData &&
                originalCustomerData?.pricingPolicy?.[Constants.ENTITY.DAR] ===
                  customerData?.pricingPolicy?.[Constants.ENTITY.DAR] &&
                mode === "edit"
              }
            >
              <option value="" disabled>
                {t("Select")}
              </option>
              {basicMasterLists?.pricingPolicy?.map((type) => (
                <option key={type} value={type}>
                  {t(type)}
                </option>
              ))}
            </select>
            {originalCustomerData &&
              customerData &&
              originalCustomerData?.pricingPolicy?.[Constants.ENTITY.DAR] !==
                customerData?.pricingPolicy?.[Constants.ENTITY.DAR] &&
              mode === "edit" && (
                <div className="current-value">
                  Previous:{" "}
                  {originalCustomerData?.pricingPolicy?.[
                    Constants.ENTITY.DAR
                  ] || "(empty)"}
                </div>
              )}
          </div>

          <div className="form-group">
            <label htmlFor="pricingPolicy">
              {t(Constants.ENTITY.VMCO)}
              {originalCustomerData &&
                customerData &&
                originalCustomerData?.pricingPolicy?.[Constants.ENTITY.VMCO] !==
                  customerData?.pricingPolicy?.[Constants.ENTITY.VMCO] &&
                mode === "edit" && (
                  <span className="update-badge">{t("Updated")}</span>
                )}
            </label>
            <select
              id="pricingPolicy"
              name={[Constants.ENTITY.VMCO]}
              className={`dropdown ${
                originalCustomerData &&
                customerData &&
                originalCustomerData?.pricingPolicy?.[Constants.ENTITY.VMCO] !==
                  customerData?.pricingPolicy?.[Constants.ENTITY.VMCO] &&
                mode === "edit"
                  ? "update-field"
                  : ""
              }`}
              value={customerData?.pricingPolicy?.[Constants.ENTITY.VMCO] || ""}
              onChange={setEntityWisePricePlan}
              disabled={
                originalCustomerData &&
                customerData &&
                originalCustomerData?.pricingPolicy?.[Constants.ENTITY.VMCO] ===
                  customerData?.pricingPolicy?.[Constants.ENTITY.VMCO] &&
                mode === "edit"
              }
            >
              <option value="" disabled>
                {t("Select")}
              </option>
              {basicMasterLists?.pricingPolicy?.map((type) => (
                <option key={type} value={type}>
                  {t(type)}
                </option>
              ))}
            </select>
            {originalCustomerData &&
              customerData &&
              originalCustomerData?.pricingPolicy?.[Constants.ENTITY.VMCO] !==
                customerData?.pricingPolicy?.[Constants.ENTITY.VMCO] &&
              mode === "edit" && (
                <div className="current-value">
                  Previous:{" "}
                  {originalCustomerData?.pricingPolicy?.[
                    Constants.ENTITY.VMCO
                  ] || "(empty)"}
                </div>
              )}
          </div>
          {/* Entity Wise Assignment for SHC */}
          <div className="form-group">
            <label htmlFor="pricingPolicy">
              {t(Constants.ENTITY.SHC)}
              {originalCustomerData &&
                customerData &&
                originalCustomerData?.pricingPolicy?.[Constants.ENTITY.SHC] !==
                  customerData?.pricingPolicy?.[Constants.ENTITY.SHC] &&
                mode === "edit" && (
                  <span className="update-badge">{t("Updated")}</span>
                )}
            </label>
            <select
              id="pricingPolicy"
              name={[Constants.ENTITY.SHC]}
              className={`dropdown ${
                originalCustomerData &&
                customerData &&
                originalCustomerData?.pricingPolicy?.[Constants.ENTITY.SHC] !==
                  customerData?.pricingPolicy?.[Constants.ENTITY.SHC] &&
                mode === "edit"
                  ? "update-field"
                  : ""
              }`}
              value={customerData?.pricingPolicy?.[Constants.ENTITY.SHC] || ""}
              onChange={setEntityWisePricePlan}
              disabled={
                originalCustomerData &&
                customerData &&
                originalCustomerData?.pricingPolicy?.[Constants.ENTITY.SHC] ===
                  customerData?.pricingPolicy?.[Constants.ENTITY.SHC] &&
                mode === "edit"
              }
            >
              <option value="" disabled>
                {t("Select")}
              </option>
              {basicMasterLists?.pricingPolicy?.map((type) => (
                <option key={type} value={type}>
                  {t(type)}
                </option>
              ))}
            </select>
            {originalCustomerData &&
              customerData &&
              originalCustomerData?.pricingPolicy?.[Constants.ENTITY.SHC] !==
                customerData?.pricingPolicy?.[Constants.ENTITY.SHC] &&
              mode === "edit" && (
                <div className="current-value">
                  Previous:{" "}
                  {originalCustomerData?.pricingPolicy?.[
                    Constants.ENTITY.SHC
                  ] || "(empty)"}
                </div>
              )}
          </div>

          {/* Entity Wise Assignment for NAQI */}
          <div className="form-group">
            <label htmlFor="pricingPolicy">
              {t(Constants.ENTITY.NAQI)}
              {originalCustomerData &&
                customerData &&
                originalCustomerData?.pricingPolicy?.[Constants.ENTITY.NAQI] !==
                  customerData?.pricingPolicy?.[Constants.ENTITY.NAQI] &&
                mode === "edit" && (
                  <span className="update-badge">{t("Updated")}</span>
                )}
            </label>
            <select
              id="pricingPolicy"
              name={[Constants.ENTITY.NAQI]}
              className={`dropdown ${
                originalCustomerData &&
                customerData &&
                originalCustomerData?.pricingPolicy?.[Constants.ENTITY.NAQI] !==
                  customerData?.pricingPolicy?.[Constants.ENTITY.NAQI] &&
                mode === "edit"
                  ? "update-field"
                  : ""
              }`}
              value={customerData?.pricingPolicy?.[Constants.ENTITY.NAQI] || ""}
              onChange={setEntityWisePricePlan}
              disabled={
                originalCustomerData &&
                customerData &&
                originalCustomerData?.pricingPolicy?.[Constants.ENTITY.NAQI] ===
                  customerData?.pricingPolicy?.[Constants.ENTITY.NAQI] &&
                mode === "edit"
              }
            >
              <option value="" disabled>
                {t("Select")}
              </option>
              {basicMasterLists?.pricingPolicy?.map((type) => (
                <option key={type} value={type}>
                  {t(type)}
                </option>
              ))}
            </select>
            {originalCustomerData &&
              customerData &&
              originalCustomerData?.pricingPolicy?.[Constants.ENTITY.NAQI] !==
                customerData?.pricingPolicy?.[Constants.ENTITY.NAQI] &&
              mode === "edit" && (
                <div className="current-value">
                  Previous:{" "}
                  {originalCustomerData?.pricingPolicy?.[
                    Constants.ENTITY.NAQI
                  ] || "(empty)"}
                </div>
              )}
          </div>

          {/* Entity Wise Assignment for GMTC */}
          <div className="form-group">
            <label htmlFor="pricingPolicy">
              {t(Constants.ENTITY.GMTC)}
              {originalCustomerData &&
                customerData &&
                originalCustomerData?.pricingPolicy?.[Constants.ENTITY.GMTC] !==
                  customerData?.pricingPolicy?.[Constants.ENTITY.GMTC] &&
                mode === "edit" && (
                  <span className="update-badge">{t("Updated")}</span>
                )}
            </label>
            <select
              id="pricingPolicy"
              name={[Constants.ENTITY.GMTC]}
              className={`dropdown ${
                originalCustomerData &&
                customerData &&
                originalCustomerData?.pricingPolicy?.[Constants.ENTITY.GMTC] !==
                  customerData?.pricingPolicy?.[Constants.ENTITY.GMTC] &&
                mode === "edit"
                  ? "update-field"
                  : ""
              }`}
              value={customerData?.pricingPolicy?.[Constants.ENTITY.GMTC] || ""}
              onChange={setEntityWisePricePlan}
              disabled={
                originalCustomerData &&
                customerData &&
                originalCustomerData?.pricingPolicy?.[Constants.ENTITY.GMTC] ===
                  customerData?.pricingPolicy?.[Constants.ENTITY.GMTC] &&
                mode === "edit"
              }
            >
              <option value="" disabled>
                {t("Select")}
              </option>
              {basicMasterLists?.pricingPolicy?.map((type) => (
                <option key={type} value={type}>
                  {t(type)}
                </option>
              ))}
            </select>
            {originalCustomerData &&
              customerData &&
              originalCustomerData?.pricingPolicy?.[Constants.ENTITY.GMTC] !==
                customerData?.pricingPolicy?.[Constants.ENTITY.GMTC] &&
              mode === "edit" && (
                <div className="current-value">
                  Previous:{" "}
                  {originalCustomerData?.pricingPolicy?.[
                    Constants.ENTITY.GMTC
                  ] || "(empty)"}
                </div>
              )}
          </div>
          <div className="form-group" />

          <h3 className="form-header full-width">{t("Delivery Charges")}</h3>
          {/* Delivery Charges Applicable */}
          <div className="form-group">
            <label className="checkbox-group-label">
              <input
                type="checkbox"
                id="isDeliveryChargesApplicable"
                name="isDeliveryChargesApplicable"
                checked={customerData?.isDeliveryChargesApplicable}
                onChange={setIsDeliveryChargesApplicable}
                disabled={
                  originalCustomerData &&
                  customerData &&
                  originalCustomerData?.isDeliveryChargesApplicable ===
                    customerData?.isDeliveryChargesApplicable &&
                  mode === "edit"
                }
              />
              {`\t ${t("Is delivery charges applicable")}`}
              {customerData?.isDeliveryChargesApplicable !==
                originalCustomerData?.isDeliveryChargesApplicable &&
                mode === "edit" && (
                  <span className="update-badge">{t("Updated")}</span>
                )}
            </label>
          </div>

          {/* Payment Methods Header */}
          <h3 className="form-header full-width">{t("Payment Methods")}</h3>

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
                disabled={
                  originalCustomerPaymentMethodsData &&
                  paymentMethods &&
                  originalCustomerPaymentMethodsData?.methodDetails?.prePayment
                    ?.isAllowed === paymentMethods?.prePayment?.isAllowed &&
                  mode === "edit"
                }
              />
              {`\t ${t("Pre-Payment")}`}
              {paymentMethods?.prePayment?.isAllowed !==
                originalCustomerPaymentMethodsData?.methodDetails?.prePayment
                  ?.isAllowed &&
                mode === "edit" && (
                  <span className="update-badge">{t("Updated")}</span>
                )}
            </label>
          </div>
          {/* <div className="form-group" /> */}

          {/* <div className="form-group">
        <label className="checkbox-group-label">
          <input
            type="checkbox"
            id="partialPayment"
            name="partialPayment"
            checked={paymentMethods?.partialPayment?.isAllowed}
            onChange={onChangeCustomerPaymentMethodsData}
          />
          {t("Partial Payment")}
          {paymentMethods?.partialPayment?.isAllowed !== originalCustomerPaymentMethodsData?.methodDetails?.partialPayment?.isAllowed && (
          <span className="update-badge">Updated</span>
        )}
        </label>
      </div> */}
          <div className="form-group" />

          <div className="form-group">
            <label className="checkbox-group-label">
              <input
                type="checkbox"
                id="COD"
                name="COD"
                checked={paymentMethods?.COD?.isAllowed}
                onChange={onChangeCustomerPaymentMethodsData}
                disabled={
                  originalCustomerPaymentMethodsData &&
                  paymentMethods &&
                  originalCustomerPaymentMethodsData?.methodDetails?.COD
                    ?.isAllowed === paymentMethods?.COD?.isAllowed &&
                  mode === "edit"
                }
              />
              {`\t ${t("Cash on Delivery (COD)")}`}
              {paymentMethods?.COD?.isAllowed !==
                originalCustomerPaymentMethodsData?.methodDetails?.COD
                  ?.isAllowed &&
                mode === "edit" && (
                  <span className="update-badge">{t("Updated")}</span>
                )}
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
                  className={`text-field small ${
                    customerPaymentMethodsData &&
                    originalCustomerPaymentMethodsData &&
                    originalCustomerPaymentMethodsData?.methodDetails?.COD
                      ?.limit != paymentMethods?.COD?.limit &&
                    mode === "edit"
                      ? "update-field"
                      : ""
                  }`}
                  placeholder={t("Enter COD limit")}
                  value={
                    customerPaymentMethodsData?.methodDetails?.COD?.limit || ""
                  }
                  onChange={onChangeCustomerPaymentMethodsData}
                  disabled={
                    originalCustomerPaymentMethodsData &&
                    paymentMethods &&
                    originalCustomerPaymentMethodsData?.methodDetails?.COD
                      ?.limit === paymentMethods?.COD?.limit &&
                    mode === "edit"
                  }
                />
              </>
            )}
          </div>

          {/* Entity Wise Credit Assignment Header */}
          <div className="form-header full-width">{t("Credit")}</div>
          {/* DAR Credit */}
          <div className="form-group">
            <label className="checkbox-group-label">
              <input
                type="checkbox"
                id={Constants.ENTITY.DAR}
                name={Constants.ENTITY.DAR}
                checked={
                  paymentMethods?.credit?.[Constants.ENTITY.DAR]?.isAllowed
                }
                onChange={setCustomerCreditChange}
                disabled={
                  originalCustomerPaymentMethodsData &&
                  paymentMethods &&
                  originalCustomerPaymentMethodsData?.methodDetails?.credit?.[
                    Constants.ENTITY.DAR
                  ]?.isAllowed ===
                    paymentMethods?.credit?.[Constants.ENTITY.DAR]?.isAllowed &&
                  mode === "edit"
                }
              />
              {`\t ${t(Constants.ENTITY.DAR)}`}
              {paymentMethods?.credit?.[Constants.ENTITY.DAR].isAllowed !==
                originalCustomerPaymentMethodsData?.methodDetails?.credit?.[
                  Constants.ENTITY.DAR
                ]?.isAllowed &&
                mode === "edit" && (
                  <span className="update-badge">{t("Updated")}</span>
                )}
            </label>
          </div>
          <div className="form-group">
            {customerPaymentMethodsData?.methodDetails?.credit?.[
              Constants.ENTITY.DAR
            ]?.isAllowed && (
              <>
                <label htmlFor="creditLimit">{t("Credit Limit")}</label>
                <input
                  type="text"
                  id="DARCreditLimit"
                  name="DARCreditLimit"
                  className={`text-field small ${
                    customerPaymentMethodsData &&
                    originalCustomerPaymentMethodsData &&
                    originalCustomerPaymentMethodsData?.methodDetails?.credit?.[
                      Constants.ENTITY.DAR
                    ]?.limit !=
                      paymentMethods?.credit?.[Constants.ENTITY.DAR]?.limit &&
                    mode === "edit"
                      ? "update-field"
                      : ""
                  }`}
                  placeholder={t("Enter credit limit")}
                  value={
                    customerPaymentMethodsData?.methodDetails?.credit?.[
                      Constants.ENTITY.DAR
                    ]?.limit || ""
                  }
                  onChange={setCustomerCreditChange}
                  disabled={
                    originalCustomerPaymentMethodsData &&
                    paymentMethods &&
                    originalCustomerPaymentMethodsData?.methodDetails?.credit?.[
                      Constants.ENTITY.DAR
                    ]?.limit ===
                      paymentMethods?.credit?.[Constants.ENTITY.DAR]?.limit &&
                    mode === "edit"
                  }
                />
                {customerPaymentMethodsData &&
                  originalCustomerPaymentMethodsData &&
                  originalCustomerPaymentMethodsData?.methodDetails?.credit?.[
                    Constants.ENTITY.DAR
                  ]?.limit !=
                    paymentMethods?.credit?.[Constants.ENTITY.DAR]?.limit &&
                  mode === "edit" && (
                    <div className="current-value">
                      Previous:{" "}
                      {originalCustomerPaymentMethodsData?.methodDetails
                        ?.credit?.[Constants.ENTITY.DAR]?.limit || "(empty)"}
                    </div>
                  )}
                {formErrors.DARCreditLimit && (
                  <div className="error">{formErrors.DARCreditLimit}</div>
                )}
              </>
            )}
          </div>
          <div className="form-group" />

          <div className="form-group">
            {customerPaymentMethodsData?.methodDetails?.credit?.[
              Constants.ENTITY.DAR
            ]?.isAllowed && (
              <>
                <label htmlFor="creditPeriod">{t("Credit Period")}</label>
                <input
                  type="text"
                  id="DARCreditPeriod"
                  name="DARCreditPeriod"
                  className={`text-field small ${
                    customerPaymentMethodsData &&
                    originalCustomerPaymentMethodsData &&
                    originalCustomerPaymentMethodsData?.methodDetails?.credit?.[
                      Constants.ENTITY.DAR
                    ]?.period !=
                      paymentMethods?.credit?.[Constants.ENTITY.DAR]?.period &&
                    mode === "edit"
                      ? "update-field"
                      : ""
                  }`}
                  placeholder={t("Enter credit period")}
                  value={
                    customerPaymentMethodsData?.methodDetails?.credit?.[
                      Constants.ENTITY.DAR
                    ]?.period || ""
                  }
                  onChange={setCustomerCreditChange}
                  disabled={
                    originalCustomerPaymentMethodsData &&
                    paymentMethods &&
                    originalCustomerPaymentMethodsData?.methodDetails?.credit?.[
                      Constants.ENTITY.DAR
                    ]?.period ===
                      paymentMethods?.credit?.[Constants.ENTITY.DAR]?.period &&
                    mode === "edit"
                  }
                />
                {customerPaymentMethodsData &&
                  originalCustomerPaymentMethodsData &&
                  originalCustomerPaymentMethodsData?.methodDetails?.credit?.[
                    Constants.ENTITY.DAR
                  ]?.period !=
                    paymentMethods?.credit?.[Constants.ENTITY.DAR]?.period &&
                  mode === "edit" && (
                    <div className="current-value">
                      Previous:{" "}
                      {originalCustomerPaymentMethodsData?.methodDetails
                        ?.credit?.[Constants.ENTITY.DAR]?.period || "(empty)"}
                    </div>
                  )}
                {formErrors.DARCreditPeriod && (
                  <div className="error">{formErrors.DARCreditPeriod}</div>
                )}
              </>
            )}
          </div>
          {/* VMCO Credit */}
          <div className="form-group">
            <label className="checkbox-group-label">
              <input
                type="checkbox"
                id={Constants.ENTITY.VMCO}
                name={Constants.ENTITY.VMCO}
                checked={
                  paymentMethods?.credit?.[Constants.ENTITY.VMCO]?.isAllowed
                }
                onChange={setCustomerCreditChange}
                disabled={
                  originalCustomerPaymentMethodsData &&
                  paymentMethods &&
                  originalCustomerPaymentMethodsData?.methodDetails?.credit?.[
                    Constants.ENTITY.VMCO
                  ]?.isAllowed ===
                    paymentMethods?.credit?.[Constants.ENTITY.VMCO]
                      ?.isAllowed &&
                  mode === "edit"
                }
              />
              {`\t ${t(Constants.ENTITY.VMCO)}`}
              {paymentMethods?.credit?.[Constants.ENTITY.VMCO].isAllowed !==
                originalCustomerPaymentMethodsData?.methodDetails?.credit?.[
                  Constants.ENTITY.VMCO
                ]?.isAllowed &&
                mode === "edit" && (
                  <span className="update-badge">{t("Updated")}</span>
                )}
            </label>
          </div>
          <div className="form-group">
            {customerPaymentMethodsData?.methodDetails?.credit?.[
              Constants.ENTITY.VMCO
            ]?.isAllowed && (
              <>
                <label htmlFor="creditLimit">{t("Credit Limit")}</label>
                <input
                  type="text"
                  id="VMCOCreditLimit"
                  name="VMCOCreditLimit"
                  className={`text-field small ${
                    customerPaymentMethodsData &&
                    originalCustomerPaymentMethodsData &&
                    originalCustomerPaymentMethodsData?.methodDetails?.credit?.[
                      Constants.ENTITY.VMCO
                    ]?.limit !=
                      paymentMethods?.credit?.[Constants.ENTITY.VMCO]?.limit &&
                    mode === "edit"
                      ? "update-field"
                      : ""
                  }`}
                  placeholder={t("Enter credit limit")}
                  value={
                    customerPaymentMethodsData?.methodDetails?.credit?.[
                      Constants.ENTITY.VMCO
                    ]?.limit || ""
                  }
                  onChange={setCustomerCreditChange}
                  disabled={
                    originalCustomerPaymentMethodsData &&
                    paymentMethods &&
                    originalCustomerPaymentMethodsData?.methodDetails?.credit?.[
                      Constants.ENTITY.VMCO
                    ]?.limit ===
                      paymentMethods?.credit?.[Constants.ENTITY.VMCO]?.limit &&
                    mode === "edit"
                  }
                />
                {customerPaymentMethodsData &&
                  originalCustomerPaymentMethodsData &&
                  originalCustomerPaymentMethodsData?.methodDetails?.credit?.[
                    Constants.ENTITY.VMCO
                  ]?.limit !=
                    paymentMethods?.credit?.[Constants.ENTITY.VMCO]?.limit &&
                  mode === "edit" && (
                    <div className="current-value">
                      Previous:{" "}
                      {originalCustomerPaymentMethodsData?.methodDetails
                        ?.credit?.[Constants.ENTITY.VMCO]?.limit || "(empty)"}
                    </div>
                  )}
                {formErrors.VMCOCreditLimit && (
                  <div className="error">{formErrors.VMCOCreditLimit}</div>
                )}
              </>
            )}
          </div>
          <div className="form-group" />

          <div className="form-group">
            {customerPaymentMethodsData?.methodDetails?.credit?.[
              Constants.ENTITY.VMCO
            ]?.isAllowed && (
              <>
                <label htmlFor="creditPeriod">{t("Credit Period")}</label>
                <input
                  type="text"
                  id="VMCOCreditPeriod"
                  name="VMCOCreditPeriod"
                  className={`text-field small ${
                    customerPaymentMethodsData &&
                    originalCustomerPaymentMethodsData &&
                    originalCustomerPaymentMethodsData?.methodDetails?.credit?.[
                      Constants.ENTITY.VMCO
                    ]?.period !=
                      paymentMethods?.credit?.[Constants.ENTITY.VMCO]?.period &&
                    mode === "edit"
                      ? "update-field"
                      : ""
                  }`}
                  placeholder={t("Enter credit period")}
                  value={
                    customerPaymentMethodsData?.methodDetails?.credit?.[
                      Constants.ENTITY.VMCO
                    ]?.period || ""
                  }
                  onChange={setCustomerCreditChange}
                  disabled={
                    originalCustomerPaymentMethodsData &&
                    paymentMethods &&
                    originalCustomerPaymentMethodsData?.methodDetails?.credit?.[
                      Constants.ENTITY.VMCO
                    ]?.period ===
                      paymentMethods?.credit?.[Constants.ENTITY.VMCO]?.period &&
                    mode === "edit"
                  }
                />
                {customerPaymentMethodsData &&
                  originalCustomerPaymentMethodsData &&
                  originalCustomerPaymentMethodsData?.methodDetails?.credit?.[
                    Constants.ENTITY.VMCO
                  ]?.period !=
                    paymentMethods?.credit?.[Constants.ENTITY.VMCO]?.period &&
                  mode === "edit" && (
                    <div className="current-value">
                      Previous:{" "}
                      {originalCustomerPaymentMethodsData?.methodDetails
                        ?.credit?.[Constants.ENTITY.VMCO]?.period || "(empty)"}
                    </div>
                  )}
                {formErrors.VMCOCreditPeriod && (
                  <div className="error">{formErrors.VMCOCreditPeriod}</div>
                )}
              </>
            )}
          </div>
          {/* SHC Credit */}
          <div className="form-group">
            <label className="checkbox-group-label">
              <input
                type="checkbox"
                id={Constants.ENTITY.SHC}
                name={Constants.ENTITY.SHC}
                checked={
                  paymentMethods?.credit?.[Constants.ENTITY.SHC]?.isAllowed
                }
                onChange={setCustomerCreditChange}
                disabled={
                  originalCustomerPaymentMethodsData &&
                  paymentMethods &&
                  originalCustomerPaymentMethodsData?.methodDetails?.credit?.[
                    Constants.ENTITY.SHC
                  ]?.isAllowed ===
                    paymentMethods?.credit?.[Constants.ENTITY.SHC]?.isAllowed &&
                  mode === "edit"
                }
              />
              {`\t ${t(Constants.ENTITY.SHC)}`}
              {paymentMethods?.credit?.[Constants.ENTITY.SHC].isAllowed !==
                originalCustomerPaymentMethodsData?.methodDetails?.credit?.[
                  Constants.ENTITY.SHC
                ]?.isAllowed &&
                mode === "edit" && (
                  <span className="update-badge">{t("Updated")}</span>
                )}
            </label>
          </div>
          <div className="form-group">
            {customerPaymentMethodsData?.methodDetails?.credit?.[
              Constants.ENTITY.SHC
            ]?.isAllowed && (
              <>
                <label htmlFor="creditLimit">{t("Credit Limit")}</label>
                <input
                  type="text"
                  id="SHCCreditLimit"
                  name="SHCCreditLimit"
                  className={`text-field small ${
                    customerPaymentMethodsData &&
                    originalCustomerPaymentMethodsData &&
                    originalCustomerPaymentMethodsData?.methodDetails?.credit?.[
                      Constants.ENTITY.SHC
                    ]?.limit !=
                      paymentMethods?.credit?.[Constants.ENTITY.SHC]?.limit &&
                    mode === "edit"
                      ? "update-field"
                      : ""
                  }`}
                  placeholder={t("Enter credit limit")}
                  value={
                    customerPaymentMethodsData?.methodDetails?.credit?.[
                      Constants.ENTITY.SHC
                    ]?.limit || ""
                  }
                  onChange={setCustomerCreditChange}
                  disabled={
                    originalCustomerPaymentMethodsData &&
                    paymentMethods &&
                    originalCustomerPaymentMethodsData?.methodDetails?.credit?.[
                      Constants.ENTITY.SHC
                    ]?.limit ===
                      paymentMethods?.credit?.[Constants.ENTITY.SHC]?.limit &&
                    mode === "edit"
                  }
                />
                {customerPaymentMethodsData &&
                  originalCustomerPaymentMethodsData &&
                  originalCustomerPaymentMethodsData?.methodDetails?.credit?.[
                    Constants.ENTITY.SHC
                  ]?.limit !=
                    paymentMethods?.credit?.[Constants.ENTITY.SHC]?.limit &&
                  mode === "edit" && (
                    <div className="current-value">
                      Previous:{" "}
                      {originalCustomerPaymentMethodsData?.methodDetails
                        ?.credit?.[Constants.ENTITY.SHC]?.limit || "(empty)"}
                    </div>
                  )}
                {formErrors.SHCCreditLimit && (
                  <div className="error">{formErrors.SHCCreditLimit}</div>
                )}
              </>
            )}
          </div>
          <div className="form-group" />

          <div className="form-group">
            {customerPaymentMethodsData?.methodDetails?.credit?.[
              Constants.ENTITY.SHC
            ]?.isAllowed && (
              <>
                <label htmlFor="creditPeriod">{t("Credit Period")}</label>
                <input
                  type="text"
                  id="SHCCreditPeriod"
                  name="SHCCreditPeriod"
                  className={`text-field small ${
                    customerPaymentMethodsData &&
                    originalCustomerPaymentMethodsData &&
                    originalCustomerPaymentMethodsData?.methodDetails?.credit?.[
                      Constants.ENTITY.SHC
                    ]?.period !=
                      paymentMethods?.credit?.[Constants.ENTITY.SHC]?.period &&
                    mode === "edit"
                      ? "update-field"
                      : ""
                  }`}
                  placeholder={t("Enter credit period")}
                  value={
                    customerPaymentMethodsData?.methodDetails?.credit?.[
                      Constants.ENTITY.SHC
                    ]?.period || ""
                  }
                  onChange={setCustomerCreditChange}
                  disabled={
                    originalCustomerPaymentMethodsData &&
                    paymentMethods &&
                    originalCustomerPaymentMethodsData?.methodDetails?.credit?.[
                      Constants.ENTITY.SHC
                    ]?.period ===
                      paymentMethods?.credit?.[Constants.ENTITY.SHC]?.period &&
                    mode === "edit"
                  }
                />
                {customerPaymentMethodsData &&
                  originalCustomerPaymentMethodsData &&
                  originalCustomerPaymentMethodsData?.methodDetails?.credit?.[
                    Constants.ENTITY.SHC
                  ]?.period !=
                    paymentMethods?.credit?.[Constants.ENTITY.SHC]?.period &&
                  mode === "edit" && (
                    <div className="current-value">
                      Previous:{" "}
                      {originalCustomerPaymentMethodsData?.methodDetails
                        ?.credit?.[Constants.ENTITY.SHC]?.period || "(empty)"}
                    </div>
                  )}
                {formErrors.SHCCreditPeriod && (
                  <div className="error">{formErrors.SHCCreditPeriod}</div>
                )}
              </>
            )}
          </div>
          {/* NAQI Credit */}
          <div className="form-group">
            <label className="checkbox-group-label">
              <input
                type="checkbox"
                id={Constants.ENTITY.NAQI}
                name={Constants.ENTITY.NAQI}
                checked={
                  paymentMethods?.credit?.[Constants.ENTITY.NAQI]?.isAllowed
                }
                onChange={setCustomerCreditChange}
                disabled={
                  originalCustomerPaymentMethodsData &&
                  paymentMethods &&
                  originalCustomerPaymentMethodsData?.methodDetails?.credit?.[
                    Constants.ENTITY.NAQI
                  ]?.isAllowed ===
                    paymentMethods?.credit?.[Constants.ENTITY.NAQI]
                      ?.isAllowed &&
                  mode === "edit"
                }
              />
              {`\t ${t(Constants.ENTITY.NAQI)}`}
              {paymentMethods?.credit?.[Constants.ENTITY.NAQI].isAllowed !==
                originalCustomerPaymentMethodsData?.methodDetails?.credit?.[
                  Constants.ENTITY.NAQI
                ]?.isAllowed &&
                mode === "edit" && (
                  <span className="update-badge">{t("Updated")}</span>
                )}
            </label>
          </div>
          <div className="form-group">
            {customerPaymentMethodsData?.methodDetails?.credit?.[
              Constants.ENTITY.NAQI
            ]?.isAllowed && (
              <>
                <label htmlFor="creditLimit">{t("Credit Limit")}</label>
                <input
                  type="text"
                  id="NAQICreditLimit"
                  name="NAQICreditLimit"
                  className={`text-field small ${
                    customerPaymentMethodsData &&
                    originalCustomerPaymentMethodsData &&
                    originalCustomerPaymentMethodsData?.methodDetails?.credit?.[
                      Constants.ENTITY.NAQI
                    ]?.limit !=
                      paymentMethods?.credit?.[Constants.ENTITY.NAQI]?.limit &&
                    mode === "edit"
                      ? "update-field"
                      : ""
                  }`}
                  placeholder={t("Enter credit limit")}
                  value={
                    customerPaymentMethodsData?.methodDetails?.credit?.[
                      Constants.ENTITY.NAQI
                    ]?.limit || ""
                  }
                  onChange={setCustomerCreditChange}
                  disabled={
                    originalCustomerPaymentMethodsData &&
                    paymentMethods &&
                    originalCustomerPaymentMethodsData?.methodDetails?.credit?.[
                      Constants.ENTITY.NAQI
                    ]?.limit ===
                      paymentMethods?.credit?.[Constants.ENTITY.NAQI]?.limit &&
                    mode === "edit"
                  }
                />
                {customerPaymentMethodsData &&
                  originalCustomerPaymentMethodsData &&
                  originalCustomerPaymentMethodsData?.methodDetails?.credit?.[
                    Constants.ENTITY.NAQI
                  ]?.limit !=
                    paymentMethods?.credit?.[Constants.ENTITY.NAQI]?.limit &&
                  mode === "edit" && (
                    <div className="current-value">
                      Previous:{" "}
                      {originalCustomerPaymentMethodsData?.methodDetails
                        ?.credit?.[Constants.ENTITY.NAQI]?.limit || "(empty)"}
                    </div>
                  )}
                {formErrors.NAQICreditLimit && (
                  <div className="error">{formErrors.NAQICreditLimit}</div>
                )}
              </>
            )}
          </div>
          <div className="form-group" />

          <div className="form-group">
            {customerPaymentMethodsData?.methodDetails?.credit?.[
              Constants.ENTITY.NAQI
            ]?.isAllowed && (
              <>
                <label htmlFor="creditPeriod">{t("Credit Period")}</label>
                <input
                  type="text"
                  id="NAQICreditPeriod"
                  name="NAQICreditPeriod"
                  className={`text-field small ${
                    customerPaymentMethodsData &&
                    originalCustomerPaymentMethodsData &&
                    originalCustomerPaymentMethodsData?.methodDetails?.credit?.[
                      Constants.ENTITY.NAQI
                    ]?.period !=
                      paymentMethods?.credit?.[Constants.ENTITY.NAQI]?.period &&
                    mode === "edit"
                      ? "update-field"
                      : ""
                  }`}
                  placeholder={t("Enter credit period")}
                  value={
                    customerPaymentMethodsData?.methodDetails?.credit?.[
                      Constants.ENTITY.NAQI
                    ]?.period || ""
                  }
                  onChange={setCustomerCreditChange}
                  disabled={
                    originalCustomerPaymentMethodsData &&
                    paymentMethods &&
                    originalCustomerPaymentMethodsData?.methodDetails?.credit?.[
                      Constants.ENTITY.NAQI
                    ]?.period ===
                      paymentMethods?.credit?.[Constants.ENTITY.NAQI]?.period &&
                    mode === "edit"
                  }
                />
                {customerPaymentMethodsData &&
                  originalCustomerPaymentMethodsData &&
                  originalCustomerPaymentMethodsData?.methodDetails?.credit?.[
                    Constants.ENTITY.NAQI
                  ]?.period !=
                    paymentMethods?.credit?.[Constants.ENTITY.NAQI]?.period &&
                  mode === "edit" && (
                    <div className="current-value">
                      Previous:{" "}
                      {originalCustomerPaymentMethodsData?.methodDetails
                        ?.credit?.[Constants.ENTITY.NAQI]?.period || "(empty)"}
                    </div>
                  )}
                {formErrors.NAQICreditPeriod && (
                  <div className="error">{formErrors.NAQICreditPeriod}</div>
                )}
              </>
            )}
          </div>
          {/* GMTC Credit */}
          <div className="form-group">
            <label className="checkbox-group-label">
              <input
                type="checkbox"
                id={Constants.ENTITY.GMTC}
                name={Constants.ENTITY.GMTC}
                checked={
                  paymentMethods?.credit?.[Constants.ENTITY.GMTC]?.isAllowed
                }
                onChange={setCustomerCreditChange}
                disabled={
                  originalCustomerPaymentMethodsData &&
                  paymentMethods &&
                  originalCustomerPaymentMethodsData?.methodDetails?.credit?.[
                    Constants.ENTITY.GMTC
                  ]?.isAllowed ===
                    paymentMethods?.credit?.[Constants.ENTITY.GMTC]
                      ?.isAllowed &&
                  mode === "edit"
                }
              />
              {`\t ${t(Constants.ENTITY.GMTC)}`}
              {paymentMethods?.credit?.[Constants.ENTITY.GMTC].isAllowed !==
                originalCustomerPaymentMethodsData?.methodDetails?.credit?.[
                  Constants.ENTITY.GMTC
                ]?.isAllowed &&
                mode === "edit" && (
                  <span className="update-badge">{t("Updated")}</span>
                )}
            </label>
          </div>
          <div className="form-group">
            {customerPaymentMethodsData?.methodDetails?.credit?.[
              Constants.ENTITY.GMTC
            ]?.isAllowed && (
              <>
                <label htmlFor="creditLimit">{t("Credit Limit")}</label>
                <input
                  type="text"
                  id="GMTCCreditLimit"
                  name="GMTCCreditLimit"
                  className={`text-field small ${
                    customerPaymentMethodsData &&
                    originalCustomerPaymentMethodsData &&
                    originalCustomerPaymentMethodsData?.methodDetails?.credit?.[
                      Constants.ENTITY.NAQI
                    ]?.limit !=
                      paymentMethods?.credit?.[Constants.ENTITY.NAQI]?.limit &&
                    mode === "edit"
                      ? "update-field"
                      : ""
                  }`}
                  placeholder={t("Enter credit limit")}
                  value={
                    customerPaymentMethodsData?.methodDetails?.credit?.[
                      Constants.ENTITY.GMTC
                    ]?.limit || ""
                  }
                  onChange={setCustomerCreditChange}
                  disabled={
                    originalCustomerPaymentMethodsData &&
                    paymentMethods &&
                    originalCustomerPaymentMethodsData?.methodDetails?.credit?.[
                      Constants.ENTITY.GMTC
                    ]?.limit ===
                      paymentMethods?.credit?.[Constants.ENTITY.GMTC]?.limit &&
                    mode === "edit"
                  }
                />
                {customerPaymentMethodsData &&
                  originalCustomerPaymentMethodsData &&
                  originalCustomerPaymentMethodsData?.methodDetails?.credit?.[
                    Constants.ENTITY.GMTC
                  ]?.limit !=
                    paymentMethods?.credit?.[Constants.ENTITY.GMTC]?.limit &&
                  mode === "edit" && (
                    <div className="current-value">
                      Previous:{" "}
                      {originalCustomerPaymentMethodsData?.methodDetails
                        ?.credit?.[Constants.ENTITY.GMTC]?.limit || "(empty)"}
                    </div>
                  )}
                {formErrors.GMTCCreditLimit && (
                  <div className="error">{formErrors.GMTCCreditLimit}</div>
                )}
              </>
            )}
          </div>
          <div className="form-group" />

          <div className="form-group">
            {customerPaymentMethodsData?.methodDetails?.credit?.[
              Constants.ENTITY.GMTC
            ]?.isAllowed && (
              <>
                <label htmlFor="creditPeriod">{t("Credit Period")}</label>
                <input
                  type="text"
                  id="GMTCCreditPeriod"
                  name="GMTCCreditPeriod"
                  className={`text-field small ${
                    customerPaymentMethodsData &&
                    originalCustomerPaymentMethodsData &&
                    originalCustomerPaymentMethodsData?.methodDetails?.credit?.[
                      Constants.ENTITY.GMTC
                    ]?.period !=
                      paymentMethods?.credit?.[Constants.ENTITY.GMTC]?.period &&
                    mode === "edit"
                      ? "update-field"
                      : ""
                  }`}
                  placeholder={t("Enter credit period")}
                  value={
                    customerPaymentMethodsData?.methodDetails?.credit?.[
                      Constants.ENTITY.GMTC
                    ]?.period || ""
                  }
                  onChange={setCustomerCreditChange}
                  disabled={
                    originalCustomerPaymentMethodsData &&
                    paymentMethods &&
                    originalCustomerPaymentMethodsData?.methodDetails?.credit?.[
                      Constants.ENTITY.GMTC
                    ]?.period ===
                      paymentMethods?.credit?.[Constants.ENTITY.GMTC]?.period &&
                    mode === "edit"
                  }
                />
                {customerPaymentMethodsData &&
                  originalCustomerPaymentMethodsData &&
                  originalCustomerPaymentMethodsData?.methodDetails?.credit?.[
                    Constants.ENTITY.GMTC
                  ]?.period !=
                    paymentMethods?.credit?.[Constants.ENTITY.GMTC]?.period &&
                  mode === "edit" && (
                    <div className="current-value">
                      Previous:{" "}
                      {originalCustomerPaymentMethodsData?.methodDetails
                        ?.credit?.[Constants.ENTITY.GMTC]?.period || "(empty)"}
                    </div>
                  )}
                {formErrors.GMTCCreditPeriod && (
                  <div className="error">{formErrors.GMTCCreditPeriod}</div>
                )}
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default FinancialInformation;
