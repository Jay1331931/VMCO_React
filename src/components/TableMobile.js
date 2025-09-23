import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import Constants from "../constants";
import { convertToTimezone, TIMEZONES } from "../utilities/convertToTimezone";
import "../styles/components.css";

const TableMobile = ({
  columns,
  allColumns,
  data,
  customCellRenderer,
  getStatusClass,
  getPaymentStatusClass,
  onRowClick,
  onPay,
  onsync,
  syncLoading,
  syncLoadingId,
  actionButtons,
}) => {
  const { t } = useTranslation();
  const [selectedRow, setSelectedRow] = useState(null);
  const [showRowPopup, setShowRowPopup] = useState(false);
  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      // You can add a toast notification here if needed
      console.log("Copied to clipboard");
    } catch (err) {
      console.error("Failed to copy: ", err);
    }
  };
  const handleRowClick = (row) => {
    setSelectedRow(row);
    setShowRowPopup(true);
    // Call original onRowClick if provided
    // if (onRowClick) {
    //     onRowClick(order);
    // }
  };
  const handleClosePopup = () => {
    setShowRowPopup(false);
    setSelectedRow(null);
  };
  const renderBodyCell = (content, title) => {
    if (!content) return "-";

    // Convert objects to JSON strings
    let contentString;
    if (typeof content === "object" && content !== null) {
      contentString = JSON.stringify(content, null, 2);
    } else {
      contentString = String(content);
    }

    const truncatedContent =
      contentString.length > 30
        ? `${contentString.substring(0, 30)}...`
        : contentString;

    return (
      <div style={{ position: "relative", paddingRight: "40px" }}>
        <div
          style={{
            maxHeight: "60px",
            overflow: "hidden",
            textOverflow: "ellipsis",
            cursor: "pointer",
            fontFamily: "monospace",
            fontSize: "12px",
          }}
          title={contentString}
        >
          {truncatedContent}
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            copyToClipboard(contentString);
          }}
          // style={{
          //     position: 'absolute',
          //     top: '0',
          //     right: '0',
          //     background: '#ccc',
          //     color: 'white',
          //     border: 'none',
          //     borderRadius: '3px',
          //     padding: '2px 8px',
          //     fontSize: '10px',
          //     cursor: 'pointer'
          // }}
          className="copy-btn"
          title={`Copy full ${title}`}
        >
          {/* <FontAwesomeIcon icon={faCopy} /> */}
          {t("Copy")}
        </button>
      </div>
    );
  };
  const renderCell = (item, column) => {
    // If there's a custom renderer for this column, use it
    if (customCellRenderer && customCellRenderer[column.key]) {
      return customCellRenderer[column.key](item);
    }

    if (column?.render) {
      return column.render(item);
    }

    // Handle nested objects (e.g., primaryContact.email)
    if (column.key.includes(".")) {
      const keys = column.key.split(".");
      let value = item;
      for (const key of keys) {
        value = value[key];
      }
      return value;
    }
    // Handle requestBody and responseBody specially
    if (column.key === "requestBody") {
      return renderBodyCell(item.requestBody, "Request Body");
    }

    if (column.key === "responseBody") {
      return renderBodyCell(item.responseBody, "Response Body");
    }
    // Handle status badges
    if (column.key === "status" && getStatusClass) {
      return (
        <span className={`status-badge ${getStatusClass(item[column.key])}`}>
          {t(item[column.key])}
        </span>
      );
    }
    if (column.key.toLowerCase() === "paymentstatus") {
      return (
        <span
          className={`status-badge ${getPaymentStatusClass(item[column.key])}`}
        >
          {t(item[column.key])}
        </span>
      );
    }
    if (column.key?.toLowerCase() === "paymentmethod") {
      return <span>{t(item[column.key])}</span>;
    }

    if (
      column.key?.toLowerCase() == "fandosync" &&
      item.customerStatus?.toLowerCase() === "approved" &&
      !item.erpCustId
    ) {
      return (
        <button
          className="action-button pay"
          onClick={(e) => {
            e.stopPropagation();
            onPay(item.id);
          }}
          disabled={syncLoading}
        >
          {syncLoading ? t("Syncing...") : t("F&O Sync")}
        </button>
      );
    }
    const COMMON_RULES = {
      SHC_GMTC: [
        // Approved cases
        {
          paymentMethod: "Pre Payment",
          paymentStatus: "Paid",
          status: "approved",
        },
        { paymentMethod: "Credit", paymentStatus: "Paid", status: "approved" },
        {
          paymentMethod: "Cash on Delivery",
          paymentStatus: "Pending",
          status: "approved",
        },

        // Open cases
        { paymentMethod: "Pre Payment", paymentStatus: "Paid", status: "open" },
        { paymentMethod: "Credit", paymentStatus: "Paid", status: "open" },
        {
          paymentMethod: "Cash on Delivery",
          paymentStatus: "Pending",
          status: "open",
        },
      ],

      NAQI_DAR: [
        {
          paymentMethod: "Pre Payment",
          paymentStatus: "Paid",
          status: "approved",
        },
        { paymentMethod: "Credit", paymentStatus: "Paid", status: "approved" },
        {
          paymentMethod: "Cash on Delivery",
          paymentStatus: "Pending",
          status: "approved",
        },
      ],
    };

    const SYNC_RULES = {
      [Constants.ENTITY.VMCO]: (item) =>
        item.isMachine
          ? [
              {
                paymentMethod: "Pre Payment",
                paymentStatus: "Pending",
                status: "approved",
              },
            ]
          : [
              {
                paymentMethod: "Pre Payment",
                paymentStatus: "Pending",
                status: "approved",
              },
              {
                paymentMethod: "Credit",
                paymentStatus: "Paid",
                status: "approved",
              },
              {
                paymentMethod: "Cash on Delivery",
                paymentStatus: "Pending",
                status: "approved",
              },
            ],

      [Constants.ENTITY.SHC]: () => COMMON_RULES.SHC_GMTC,
      [Constants.ENTITY.GMTC]: () => COMMON_RULES.SHC_GMTC,
      [Constants.ENTITY.NAQI]: () => COMMON_RULES.NAQI_DAR,
      [Constants.ENTITY.DAR]: () => COMMON_RULES.NAQI_DAR,
    };

    if (column.key?.toLowerCase() === "ordersync" && !item.erpOrderId) {
      const entity = item.entity?.toLowerCase();
      const rules = SYNC_RULES[item.entity]?.(item) || [];

      const isValidForSync = rules.some(
        (rule) =>
          rule.paymentMethod.toLowerCase() ===
            item.paymentMethod?.toLowerCase() &&
          rule.paymentStatus.toLowerCase() ===
            item.paymentStatus?.toLowerCase() &&
          rule.status.toLowerCase() === item.status?.toLowerCase()
      );

      if (isValidForSync) {
        return (
          <button
            className="action-button pay"
            disabled={syncLoading}
            onClick={(e) => {
              e.stopPropagation();
              console.log("item", item);
              onsync(item.id);
            }}
          >
            {syncLoadingId === item.id && syncLoading
              ? t("Syncing...")
              : t("F&O Sync")}
          </button>
        );
      }
    }

    // if(column.key?.toLowerCase()=="ordersync" && item.entity.toLowerCase()===Constants.ENTITY.VMCO.toLowerCase() && item.status.toLowerCase()=="approved" &&!item.erpOrderId  ){
    //     return (
    //         <button
    //             className="action-button pay"
    //             onClick={(e) => {
    //                 e.stopPropagation();
    //                 console.log("item",item)
    //                 onsync(item.id);
    //             }}
    //         >
    //             {t('F&O Sync')}
    //         </button>
    //     );
    // }
    // Handle action buttons
    if (column.key === "actions" && actionButtons) {
      return actionButtons(item);
    }
    // Handle pay button
    if (
      column.key.toLowerCase() === "pay" &&
      onPay &&
      item?.paymentMethod?.toLowerCase() != "cash on delivery" &&
      item.paymentStatus?.toLowerCase() !== "paid" &&
      (item.status?.toLowerCase() === "approved" ||
        (item.status?.toLowerCase() === "open" &&
          (item.entity.toLowerCase() === Constants.ENTITY.DAR.toLowerCase() ||
            item.entity.toLowerCase() === Constants.ENTITY.GMTC.toLowerCase() ||
            item.entity.toLowerCase() ===
              Constants.ENTITY.SHC.toLowerCase())) ||
        (item.status?.toLowerCase() === "pending" &&
          (item.entity.toLowerCase() === Constants.ENTITY.DAR.toLowerCase() ||
            item.entity.toLowerCase() === Constants.ENTITY.NAQI.toLowerCase())))
    ) {
      return (
        <button
          className="action-button pay"
          onClick={(e) => {
            console.log("Pay button clicked for item:", item);
            e.stopPropagation(); // Prevent row click event
            onPay(item, false);
          }}
        >
          {t("Pay")}
        </button>
      );
    }
    if (
      column.key?.toLowerCase() === "sendlink" &&
      item?.paymentMethod?.toLowerCase() != "cash on delivery" &&
      item.paymentStatus?.toLowerCase() !== "paid" &&
      (item.status?.toLowerCase() === "approved" ||
        (item.status?.toLowerCase() === "open" &&
          (item.entity.toLowerCase() === Constants.ENTITY.DAR.toLowerCase() ||
            item.entity.toLowerCase() === Constants.ENTITY.GMTC.toLowerCase() ||
            item.entity.toLowerCase() ===
              Constants.ENTITY.SHC.toLowerCase())) ||
        (item.status?.toLowerCase() === "pending" &&
          (item.entity.toLowerCase() === Constants.ENTITY.DAR.toLowerCase() ||
            item.entity.toLowerCase() === Constants.ENTITY.NAQI.toLowerCase())))
    ) {
      return (
        <button
          className="action-button pay"
          onClick={(e) => {
            console.log("Pay button clicked for item:", item);
            e.stopPropagation(); // Prevent row click event
            onPay(item, true);
          }}
        >
          {t("Send Link")}
        </button>
      );
    }

    const value = item[column.key];

    // If value is an object, stringify it
    if (typeof value === "object" && value !== null) {
      return JSON.stringify(value);
    }
    // Identify whether value string is a date

    if (isDateString(value)) {
      // Format date if needed, or just return value
      // return in dd/mm/yyyy format
      const date = new Date(value);
      if (isNaN(date.getTime())) return value; // Invalid date
      // Format date to dd/mm/yyyy
      // return new Intl.DateTimeFormat('en-GB', {
      //     day: '2-digit',
      //     month: '2-digit',
      //     year: 'numeric',
      // }).format(date);
      // Use your custom function to convert to Saudi Arabia timezone
      return convertToTimezone(value, TIMEZONES.SAUDI_ARABIA, "DD/MM/YYYY");
    }

    // Default cell rendering
    return item[column.key];
  };
  const isDateString = (val) => {
    if (val instanceof Date) return true;
    if (typeof val === "string") {
      // Matches YYYY-MM-DD or YYYY-MM-DDTHH:mm:ssZ
      return /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(.\d+)?(Z|([+-]\d{2}:\d{2}))?)?$/.test(
        val
      );
    }
    return false;
  };
  const renderPopupCell = (item, column) => {
    // If there's a custom renderer for this column, use it
    if (customCellRenderer && customCellRenderer[column.key]) {
      return customCellRenderer[column.key](item);
    }

    if (column?.render) {
      return column.render(item);
    }

    // Handle nested objects
    if (column.key.includes(".")) {
      const keys = column.key.split(".");
      let value = item;
      for (const key of keys) {
        value = value[key];
      }
      return value;
    }

    // Handle requestBody and responseBody specially
    if (column.key === "requestBody") {
      return renderBodyCell(item.requestBody, "Request Body");
    }

    if (column.key === "responseBody") {
      return renderBodyCell(item.responseBody, "Response Body");
    }

    // Handle status badges
    if (column.key === "status" && getStatusClass) {
      return (
        <span
          className={`status-badge-large ${getStatusClass(item[column.key])}`}
        >
          {t(item[column.key])}
        </span>
      );
    }

    if (column.key.toLowerCase() === "paymentstatus") {
      return (
        <span
          className={`status-badge-large ${getPaymentStatusClass(
            item[column.key]
          )}`}
        >
          {t(item[column.key])}
        </span>
      );
    }

    if (column.key?.toLowerCase() === "paymentmethod") {
      return <span>{t(item[column.key])}</span>;
    }

    const value = item[column.key];

    // If value is an object, stringify it
    if (typeof value === "object" && value !== null) {
      return JSON.stringify(value);
    }

    // Handle dates
    if (isDateString(value)) {
      return convertToTimezone(
        value,
        TIMEZONES.SAUDI_ARABIA,
        "DD/MM/YYYY HH:mm"
      );
    }

    // Default cell rendering
    return value || "-";
  };
  const handlePopupAction = (actionType, item, sendLink = false) => {
    switch (actionType) {
      case "pay":
        if (onPay) onPay(item, sendLink);
        break;
      case "sync":
        if (onsync) onsync(item.id);
        break;
      case "fandoSync":
        if (onPay) onPay(item.id);
        break;
    }
    handleClosePopup();
  };

  // Check if action buttons should be shown in popup
  const shouldShowAction = (columnKey, item) => {
    switch (columnKey.toLowerCase()) {
      case "fandosync":
        return (
          item.customerStatus?.toLowerCase() === "approved" && !item.erpCustId
        );
      case "ordersync":
        const COMMON_RULES = {
          SHC_GMTC: [
            {
              paymentMethod: "Pre Payment",
              paymentStatus: "Paid",
              status: "approved",
            },
            {
              paymentMethod: "Credit",
              paymentStatus: "Paid",
              status: "approved",
            },
            {
              paymentMethod: "Cash on Delivery",
              paymentStatus: "Pending",
              status: "approved",
            },
            {
              paymentMethod: "Pre Payment",
              paymentStatus: "Paid",
              status: "open",
            },
            { paymentMethod: "Credit", paymentStatus: "Paid", status: "open" },
            {
              paymentMethod: "Cash on Delivery",
              paymentStatus: "Pending",
              status: "open",
            },
          ],
          NAQI_DAR: [
            {
              paymentMethod: "Pre Payment",
              paymentStatus: "Paid",
              status: "approved",
            },
            {
              paymentMethod: "Credit",
              paymentStatus: "Paid",
              status: "approved",
            },
            {
              paymentMethod: "Cash on Delivery",
              paymentStatus: "Pending",
              status: "approved",
            },
          ],
        };

        const SYNC_RULES = {
          [Constants.ENTITY.VMCO]: (item) =>
            item.isMachine
              ? [
                  {
                    paymentMethod: "Pre Payment",
                    paymentStatus: "Pending",
                    status: "approved",
                  },
                ]
              : [
                  {
                    paymentMethod: "Pre Payment",
                    paymentStatus: "Pending",
                    status: "approved",
                  },
                  {
                    paymentMethod: "Credit",
                    paymentStatus: "Paid",
                    status: "approved",
                  },
                  {
                    paymentMethod: "Cash on Delivery",
                    paymentStatus: "Pending",
                    status: "approved",
                  },
                ],
          [Constants.ENTITY.SHC]: () => COMMON_RULES.SHC_GMTC,
          [Constants.ENTITY.GMTC]: () => COMMON_RULES.SHC_GMTC,
          [Constants.ENTITY.NAQI]: () => COMMON_RULES.NAQI_DAR,
          [Constants.ENTITY.DAR]: () => COMMON_RULES.NAQI_DAR,
        };

        const rules = SYNC_RULES[item.entity]?.(item) || [];
        return (
          rules.some(
            (rule) =>
              rule.paymentMethod.toLowerCase() ===
                item.paymentMethod?.toLowerCase() &&
              rule.paymentStatus.toLowerCase() ===
                item.paymentStatus?.toLowerCase() &&
              rule.status.toLowerCase() === item.status?.toLowerCase()
          ) && !item.erpOrderId
        );

      case "pay":
        return (
          item?.paymentMethod?.toLowerCase() !== "cash on delivery" &&
          item.paymentStatus?.toLowerCase() !== "paid" &&
          (item.status?.toLowerCase() === "approved" ||
            (item.status?.toLowerCase() === "open" &&
              (item.entity.toLowerCase() ===
                Constants.ENTITY.DAR.toLowerCase() ||
                item.entity.toLowerCase() ===
                  Constants.ENTITY.GMTC.toLowerCase() ||
                item.entity.toLowerCase() ===
                  Constants.ENTITY.SHC.toLowerCase())) ||
            (item.status?.toLowerCase() === "pending" &&
              (item.entity.toLowerCase() ===
                Constants.ENTITY.DAR.toLowerCase() ||
                item.entity.toLowerCase() ===
                  Constants.ENTITY.NAQI.toLowerCase())))
        );

      case "sendlink":
        return (
          item?.paymentMethod?.toLowerCase() !== "cash on delivery" &&
          item.paymentStatus?.toLowerCase() !== "paid" &&
          (item.status?.toLowerCase() === "approved" ||
            (item.status?.toLowerCase() === "open" &&
              (item.entity.toLowerCase() ===
                Constants.ENTITY.DAR.toLowerCase() ||
                item.entity.toLowerCase() ===
                  Constants.ENTITY.GMTC.toLowerCase() ||
                item.entity.toLowerCase() ===
                  Constants.ENTITY.SHC.toLowerCase())) ||
            (item.status?.toLowerCase() === "pending" &&
              (item.entity.toLowerCase() ===
                Constants.ENTITY.DAR.toLowerCase() ||
                item.entity.toLowerCase() ===
                  Constants.ENTITY.NAQI.toLowerCase())))
        );

      default:
        return true;
    }
  };
  return (
    <>
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              {columns.map((column) => (
                <th key={column.key}>
                  {typeof column.header === "function"
                    ? column.header()
                    : t(column.header)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, index) => (
              <tr
                key={index}
                onClick={() => {
                  handleRowClick(row);
                  // if (onRowClick) {
                  //     console.log('Table component: row clicked', row);
                  //     // onRowClick(row);
                  // }
                }}
                // style={{ cursor: onRowClick ? 'pointer' : 'default' }}
              >
                {columns.map((column) => (
                  <td key={`${row.id || index}-${column.key}`}>
                    {renderCell(row, column)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        <style>{`
                .table-container {
                    margin-bottom: 20px;
                    overflow-x: auto;
                    justify-content: center;
                    align-items: center;
                    height: auto;
                }
                .data-table {
                    width: 100%;
                    font-size: medium;
                    background-color: white;
                    border: 1.9px solid #D9D9D6;
                    border-radius: 15px;
                    overflow: hidden;
                    color: #5E6A71;
                }
                .data-table th,
                .data-table td {
                    padding: 0 10px;
                    cursor: pointer;
                }
                .data-table th {
                    padding: 12px 16px;
                    height: 60px;
                    text-align: center;
                    border-bottom: 1.9px solid #D9D9D6;
                    background-color: #fff;
                    font-weight: 600;
                    color: #5E6A71;
                }
                .data-table td {
                    padding: 12px 16px;
                    height: 60px;
                    text-align: center;
                }
                .data-table tr:nth-child(odd) {
                    background-color: #FFF;
                }
                .data-table tr:nth-child(even) {
                    background-color: #F4F5F6;
                }
                .data-table tr:hover {
                    background-color: #edf2f7;
                }
                .status-badge {
                    width: 100px;
                    height: 30px;
                    line-height: 30px;
                    font-size: 0.85rem;
                    border-radius: 40px;
                    display: inline-block;
                    text-align: center;
                    font-weight: 600;
                }
                .action-buttons {
                    display: center;
                    gap: 0;
                }
                .action-button {
                    padding: 6px 12px;
                    border-radius: 4px;
                    border: none;
                    font-size: 0.85rem;
                    font-weight: 600;
                    cursor: pointer;
                }
                .action-button.resend,
                .action-button.invite {
                    background-color: transparent;
                    color: #1F4DE2;
                }
                .action-button.pay {
                    background-color: #00594C;
                    color: white;
                }
                .action-button:hover {
                    opacity: 0.9;
                }
                @media (max-width: 768px) {
                    .table-container {
                        overflow-x: auto;
                        justify-content: center;
                        align-items: center;
                    }
                    .data-table {
                        font-size: xx-small;
                    }
                    .data-table th,
                    .data-table td {
                        padding: 0 10px;
                    }
                    .status-badge {
                        width: 70px;
                        height: 30px;
                        line-height: 30px;
                        font-size: 0.75rem;
                    }
                }
            `}</style>
      </div>
      {/* {showRowPopup && (
            <div className="row-popup-overlay" onClick={handleClosePopup}>
            <div className="row-popup" onClick={e => e.stopPropagation()}>
                <button className="popup-close" onClick={handleClosePopup}>×</button>
                
                <div className="popup-content">
                    <div className="popup-header-section">
                    </div>

                </div>

                <style>{`
                    .row-popup-overlay {
                        position: fixed;
                        top: 0; left: 0; right: 0; bottom: 0;
                        background: rgba(0,0,0,0.12);
                        z-index: 1000;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        padding: 24px;
                    }
                    .row-popup {
                        background: #fff;
                        border-radius: 8px;
                        box-shadow: 0 4px 16px rgba(0,0,0,0.10);
                        padding: 0;
                        max-width: 800px;
                        width: 100%;
                        max-height: 90vh;
                        overflow-y: auto;
                        position: relative;
                        animation: popup-fade-in 0.18s;
                    }
                    @keyframes popup-fade-in {
                        from { opacity: 0; transform: scale(0.97); }
                        to { opacity: 1; transform: scale(1); }
                    }
                    .popup-close {
                        position: absolute;
                        top: 18px;
                        right: 18px;
                        background: none;
                        border: none;
                        font-size: 2rem;
                        color: #888;
                        cursor: pointer;
                        z-index: 2;
                        transition: color 0.15s;
                    }
                    .popup-close:hover {
                        color: #0a5640;
                    }
                    .popup-content {
                        padding: 48px 48px 40px 48px;
                    }
                    .popup-header-section {
                        margin-bottom: 32px;
                        border-bottom: 1px solid #e0e0e0;
                        padding-bottom: 16px;
                    }
                    .popup-order-title {
                        font-size: 1.5rem;
                        font-weight: 600;
                        margin: 0 0 8px 0;
                        color: #222;
                    }
                    .order-id {
                        font-size: 1rem;
                        color: #666;
                        font-weight: 500;
                    }
                    .order-details-grid {
                        display: grid;
                        gap: 24px;
                        margin-bottom: 32px;
                    }
                    .order-section {
                        background: #f8f9fa;
                        padding: 20px;
                        border-radius: 8px;
                        border: 1px solid #e0e0e0;
                    }
                    .section-title {
                        font-size: 1.1rem;
                        font-weight: 600;
                        margin: 0 0 16px 0;
                        color: #222;
                        border-bottom: 1px solid #ddd;
                        padding-bottom: 8px;
                    }
                    .order-detail-row {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        margin-bottom: 12px;
                        padding: 8px 0;
                    }
                    .order-detail-label {
                        font-weight: 600;
                        color: #555;
                        min-width: 140px;
                    }
                    .order-detail-value {
                        color: #222;
                        text-align: right;
                        flex: 1;
                    }
                    .status-badge-large {
                        padding: 6px 16px;
                        border-radius: 20px;
                        font-size: 0.9rem;
                        font-weight: 600;
                        display: inline-block;
                    }
                    .address-details {
                        color: #555;
                        line-height: 1.5;
                    }
                    .items-section {
                        grid-column: 1 / -1;
                    }
                    .order-items-list {
                        display: flex;
                        flex-direction: column;
                        gap: 12px;
                    }
                    .order-item {
                        background: white;
                        padding: 16px;
                        border-radius: 6px;
                        border: 1px solid #e0e0e0;
                    }
                    .item-name {
                        font-weight: 600;
                        margin-bottom: 8px;
                        color: #222;
                    }
                    .item-details {
                        display: flex;
                        justify-content: space-between;
                        gap: 16px;
                        font-size: 0.9rem;
                        color: #555;
                    }
                    .popup-actions {
                        display: flex;
                        gap: 12px;
                        justify-content: flex-end;
                        flex-wrap: wrap;
                        margin-top: 24px;
                        padding-top: 24px;
                        border-top: 1px solid #e0e0e0;
                    }
                    .action-button {
                        padding: 10px 20px;
                        border-radius: 4px;
                        border: none;
                        font-size: 0.9rem;
                        font-weight: 600;
                        cursor: pointer;
                        transition: all 0.2s;
                        min-width: 120px;
                    }
                    .action-button.primary {
                        background-color: #0a5640;
                        color: white;
                    }
                    .action-button.secondary {
                        background-color: #00205B;
                        color: white;
                    }
                    .action-button.outline {
                        background-color: transparent;
                        color: #666;
                        border: 1px solid #666;
                    }
                    .action-button:hover {
                        opacity: 0.9;
                        transform: translateY(-1px);
                    }
                    .action-button:disabled {
                        opacity: 0.6;
                        cursor: not-allowed;
                        transform: none;
                    }
                    @media (max-width: 768px) {
                        .row-popup {
                            margin: 20px;
                            max-height: 95vh;
                        }
                        .popup-content {
                            padding: 32px 16px 24px 16px;
                        }
                        .order-details-grid {
                            gap: 16px;
                        }
                        .order-detail-row {
                            flex-direction: column;
                            align-items: flex-start;
                            gap: 4px;
                        }
                        .order-detail-value {
                            text-align: left;
                        }
                        .item-details {
                            flex-direction: column;
                            gap: 4px;
                        }
                        .popup-actions {
                            flex-direction: column;
                        }
                        .action-button {
                            min-width: 100%;
                        }
                    }
                    @media (max-width: 480px) {
                        .row-popup-overlay {
                            padding: 16px;
                        }
                        .row-popup {
                            margin: 0;
                        }
                    }
                `}</style>
            </div>
        </div>)} */}
      {showRowPopup && selectedRow && (
        <div className="row-popup-overlay" onClick={handleClosePopup}>
          <div className="row-popup" onClick={(e) => e.stopPropagation()}>
            <button className="popup-close" onClick={handleClosePopup}>
              ×
            </button>

            <div className="popup-content">
              <div className="popup-header-section">
                <h2 className="popup-row-title">{t("Details")}</h2>
                <div className="row-id">ID: {selectedRow.id}</div>
              </div>

              <div className="row-details-grid">
                {allColumns.map((column) => {
                  if (column.key === "actions" && actionButtons) {
                    return (
                      <div
                        key={column.key}
                        // className="row-section action-section"
                        className="row-detail-row"
                      >
                        <span className="row-details-label">{t("Actions")}</span>
                        <div className="action-buttons-popup">
                          {actionButtons(selectedRow)}
                        </div>
                      </div>
                    );
                  }

                  const value = renderPopupCell(selectedRow, column);
                  const displayValue =
                    value !== undefined && value !== null ? value : "-";

                  return (
                    // <div key={column.key} className="row-section">
                      <div className="row-detail-row">
                        <span className="row-detail-label">
                          {typeof column.header === "function"
                            ? column.header()
                            : t(column.header)}
                          :
                        </span>
                        <span className="row-detail-value">{displayValue}</span>
                      </div>
                  );
                })}

                {/* Additional Action Buttons */}
                {/* <div className="row-section actions-section">
                  <h3 className="section-title">{t("Quick Actions")}</h3>
                  <div className="action-buttons-popup">
                    {shouldShowAction("pay", selectedRow) && (
                      <>
                        <button
                          className="action-button primary"
                          onClick={() =>
                            handlePopupAction("pay", selectedRow, false)
                          }
                        >
                          {t("Pay")}
                        </button>
                        <button
                          className="action-button secondary"
                          onClick={() =>
                            handlePopupAction("pay", selectedRow, true)
                          }
                        >
                          {t("Send Link")}
                        </button>
                      </>
                    )}

                    {shouldShowAction("ordersync", selectedRow) && (
                      <button
                        className="action-button outline"
                        onClick={() => handlePopupAction("sync", selectedRow)}
                        disabled={
                          syncLoading && syncLoadingId === selectedRow.id
                        }
                      >
                        {syncLoading && syncLoadingId === selectedRow.id
                          ? t("Syncing...")
                          : t("F&O Sync")}
                      </button>
                    )}

                    {shouldShowAction("fandosync", selectedRow) && (
                      <button
                        className="action-button outline"
                        onClick={() =>
                          handlePopupAction("fandoSync", selectedRow)
                        }
                        disabled={syncLoading}
                      >
                        {syncLoading ? t("Syncing...") : t("F&O Sync")}
                      </button>
                    )}
                  </div>
                </div> */}
              </div>
            </div>

            <style>{`
                            .row-popup-overlay {
                                position: fixed;
                                top: 0; left: 0; right: 0; bottom: 0;
                                background: rgba(0,0,0,0.12);
                                z-index: 1000;
                                display: flex;
                                align-items: center;
                                justify-content: center;
                                padding: 24px;
                            }
                            .row-popup {
                                background: #fff;
                                border-radius: 8px;
                                box-shadow: 0 4px 16px rgba(0,0,0,0.10);
                                padding: 0;
                                max-width: 800px;
                                width: 100%;
                                max-height: 90vh;
                                overflow-y: auto;
                                position: relative;
                                animation: popup-fade-in 0.18s;
                            }
                            @keyframes popup-fade-in {
                                from { opacity: 0; transform: scale(0.97); }
                                to { opacity: 1; transform: scale(1); }
                            }
                            .popup-close {
                                position: absolute;
                                top: 18px;
                                right: 18px;
                                background: none;
                                border: none;
                                font-size: 2rem;
                                color: #888;
                                cursor: pointer;
                                z-index: 2;
                                transition: color 0.15s;
                            }
                            .popup-close:hover {
                                color: #0a5640;
                            }
                            .popup-content {
                                padding: 48px 48px 40px 48px;
                            }
                            .popup-header-section {
                                border-bottom: 1px solid #e0e0e0;
                            }
                            .popup-row-title {
                                margin: 0 0 8px 0;
                                color: #222;
                            }
                            .row-id {
                                font-size: 1rem;
                                color: #666;
                                font-weight: 500;
                            }
                            .row-details-grid {
                                display: grid;
                                grid-template-columns: repeat(2, 1fr);
                            }
                            
                            .row-section.actions-section {
                                background: #fff;
                            }
                            .section-title {
                                margin-bottom: 8px;
                            }
                            .row-detail-row {
                                display: flex;
                                justify-content: space-between;
                                align-items: flex-start;
                                margin-bottom: 12px;
                                padding: 8px 0;
                                gap: 16px;
                            }
                            .row-detail-label {
                                color: #555;
                                min-width: 160px;
                                flex-shrink: 0;
                            }
                            .row-detail-value {
                                font-weight: 500;
                                color: #222;
                                text-align: right;
                                flex: 1;
                                word-break: break-word;
                                overflow-wrap: break-word;
                            }
                            .status-badge-large {
                                padding: 6px 16px;
                                border-radius: 20px;
                                font-size: 0.9rem;
                                font-weight: 600;
                                display: inline-block;
                            }
                            .action-buttons-popup {
                                display: flex;
                                gap: 12px;
                                flex-wrap: wrap;
                            }
                            .action-button {
                                padding: 10px 20px;
                                border-radius: 4px;
                                border: none;
                                font-size: 0.9rem;
                                font-weight: 600;
                                cursor: pointer;
                                transition: all 0.2s;
                                min-width: 120px;
                            }
                            .action-button.primary {
                                background-color: #0a5640;
                                color: white;
                            }
                            .action-button.secondary {
                                background-color: #00205B;
                                color: white;
                            }
                            .action-button.outline {
                                background-color: transparent;
                                color: #666;
                                border: 1px solid #666;
                            }
                            .action-button:hover {
                                opacity: 0.9;
                                transform: translateY(-1px);
                            }
                            .action-button:disabled {
                                opacity: 0.6;
                                cursor: not-allowed;
                                transform: none;
                            }
                            @media (max-width: 768px) {
                                .row-popup {
                                    margin: 20px;
                                    max-height: 95vh;
                                }
                                .popup-content {
                                    padding: 32px 16px 24px 16px;
                                }
                                .row-detail-row {
                                    flex-direction: column;
                                    align-items: flex-start;
                                    gap: 8px;
                                }
                                .row-detail-value {
                                    text-align: left;
                                }
                                .action-buttons-popup {
                                    flex-direction: column;
                                }
                                .action-button {
                                    min-width: 100%;
                                }
                            }
                            @media (max-width: 480px) {
                                .row-popup-overlay {
                                    padding: 16px;
                                }
                                .row-popup {
                                    margin: 0;
                                }
                                .popup-content {
                                    padding: 24px 12px 20px 12px;
                                }
                            }
                        `}</style>
          </div>
        </div>
      )}
    </>
  );
};

export default TableMobile;
