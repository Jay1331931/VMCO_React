import React from "react";
import { useTranslation } from "react-i18next";
import i18n from "../i18n";

// const inventoryData = [
//   { name: "Product Name 01", orderQty: 20, availableQty: 10 },
//   { name: "Product Name 01", orderQty: 30, availableQty: 35 },
//   { name: "Product Name 01", orderQty: 20, availableQty: 25 },
//   { name: "Product Name 01", orderQty: 30, availableQty: 45 },
// ];

function GetInventory({ open, onClose, InventoryData, productName }) {
  const { t } = useTranslation();
  if (!open) return null;
 
  return (
    <div>
      <div className="gi-backdrop" />
      <div className="gi-modal">
        <div className="gi-header">
          {/* <span className="gi-title">{t("Get Inventory")}</span> */}
          <span className="gi-title">{InventoryData[0]?.erpProdId || ""} : {productName || ""} </span>{" "}
        </div>
        <div className="gi-table-container">
          <table className="gi-table">
            <thead>
              <tr>
               
                <th>{t("ERP Site ID")}</th>
                <th>{t("Warehouse Name")}</th>
                 <th>{t("Available Quantity")}</th>
              </tr>
            </thead>
            <tbody>
              {InventoryData?.map((row, idx) => (
                <tr key={idx}>
                  
                  <td>{row.erpSiteId || ""}</td>
                  <td>{i18n.language==="en" ? row.erpWarehouseName : row.erpWarehouseNameAr}</td>
                  <td>{row.availableQty || 0}</td> 
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="gi-footer">
          <button className="gi-close-btn" onClick={onClose}>
            {t("Close")}
          </button>
        </div>
      </div>

      <style>{`
        .gi-backdrop {
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(0,0,0,0.15);
          z-index: 1000;
        }
        .gi-modal {
          position: fixed;
          top: 50%; left: 50%;
          transform: translate(-50%, -50%);
          background: #fff;
          border-radius: 12px;
          box-shadow: 0 8px 32px rgba(0,0,0,0.18);
          width: 800px;
          max-width: 95vw;
          z-index: 1001;
          padding: 0;
          animation: gi-fadein 0.2s;
        }
        @keyframes gi-fadein {
          from { opacity: 0; transform: translate(-50%, -60%);}
          to { opacity: 1; transform: translate(-50%, -50%);}
        }
        .gi-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 22px 28px 10px 28px;
        }
        .gi-title {
          font-size: 1.25rem;
          font-weight: light;
        }
        .gi-table-container {
          margin: 10px 28px;
          padding: 6px;
          border: 1.9px solid #eee;
            border-radius: 10px;
        }
        .gi-table {
          width: 100%;
          border-collapse: collapse;
        }
        .gi-table th, .gi-table td {
          padding: 20px 8px;
          text-align: left;
        }
        .gi-table th {
          background: #fff;
          font-weight: 500;
          border-bottom: 1px solid #eee;
        }
        .gi-table tr:not(:last-child) {
          border-bottom: 1px solid #eee;
        }
        .gi-footer {
          display: flex;
          justify-content: flex-end;
          padding: 16px 28px 22px 28px;
        }
        .gi-close-btn {
          padding: 7px 28px;
          border-radius: 6px;
          border: 1px solid #bbb;
          background: #fff;
          color: #222;
          font-size: 1rem;
          cursor: pointer;
          transition: background 0.15s;
        }
        .gi-close-btn:hover {
          background: #f2f2f2;
        }
      `}</style>
    </div>
  );
}

export default GetInventory;
