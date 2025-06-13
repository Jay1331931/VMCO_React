import React, { useState, useEffect } from 'react';

function GetPaymentMethods({
  open,
  onClose,
  onSelectPaymentMethod,
  API_BASE_URL,
  t = (x) => x,
  category,
  customerId,
  totalAmount
}) {
  const [methods, setMethods] = useState([]);
  const [balances, setBalances] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch payment methods
  useEffect(() => {
    console.log('Passed items:', category, customerId, totalAmount)
    if (!open) return;
    setLoading(true);
    setError(null);
    fetch(`${API_BASE_URL}/basics-masters?filters={"masterName": "paymentMethod"}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include'
    })
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch payment method options');
        return res.json();
      })
      .then(result => {
        let paymentMethods = [];
        if (result.status === 'Ok' && result.data) {
          paymentMethods = result.data.map(item => item.value);
        } else if (result.data && Array.isArray(result.data)) {
          paymentMethods = result.data.map(item => item.value);
        } else {
          throw new Error('Unexpected response format for payment method options');
        }

        // Filter payment methods based on category (match Cart logic)
        let allowedMethods = paymentMethods;
        const cat = (category || '').toLowerCase();
        if (cat.includes('vmco') && cat.includes('machines')) {
          allowedMethods = paymentMethods.filter(
            m => m === 'Pre Payment' || m === 'Partial Payment'
          );
        } else {
          allowedMethods = paymentMethods.filter(
            m => m === 'Pre Payment' || m === 'Credit' || m === 'Cash on Delivery'
          );
        }
        setMethods(allowedMethods);
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [open, API_BASE_URL, category]);

  // Fetch payment method balances for the customer
  useEffect(() => {
    console.log('Open:', open, 'Customer ID:', customerId);
    if (!open || !customerId) return;
    fetch(`${API_BASE_URL}/payment-method/id/${customerId}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include'
      })
      .then(res => res.json())
      .then(result => {
        console.log('Fetched payment method balances:', result);
        if (result.status === 'Ok' && result.data) {
          const methodDetails = result.data.methodDetails;
          if (methodDetails) {
            console.log('Raw balances data fetched:', methodDetails);
            // Map method names to balances
            //const details = customerData.methodDetails;
            const map = {};
            // Normalize method names to match those in methods array
            map['Cash on Delivery'] = methodDetails.COD.limit ? Number(methodDetails.COD.limit).toFixed(2) : 'NA';
            if (methodDetails.credit) map['Credit'] = methodDetails.credit.balance ? Number(methodDetails.credit.balance).toFixed(2) : 'NA';
            if (methodDetails.prePayment) map['Pre Payment'] = methodDetails.prePayment.balance ? Number(methodDetails.prePayment.balance).toFixed(2) : 'NA';
            if (methodDetails.partialPayment) map['Partial Payment'] = methodDetails.partialPayment.balance ? Number(methodDetails.partialPayment.balance).toFixed(2) : 'NA';
            setBalances(map);
          }
        }
      })
      .catch(() => setBalances({}));
    }, [open, customerId]);

  if (!open) return null;

  return (
    <div>
      <div className="gp-backdrop" onClick={onClose} />
      <div className="gp-modal">
        <div className="gp-header">
          <span className="gp-title">{t("Select Payment Method")}</span>
          <button className="gp-close-btn" onClick={onClose} style={{ marginLeft: 'auto' }}>
            {t("Close")}
          </button>
        </div>
        <div className="gp-table-container">
          {loading ? (
            <div style={{ padding: 24 }}>{t("Loading...")}</div>
          ) : error ? (
            <div style={{ padding: 24, color: 'red' }}>{error}</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>{t('Payment Method')}</th>
                  <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>{t('Balance')}</th>
                  <th style={{ padding: '10px', borderBottom: '1px solid #ddd' }}></th>
                </tr>
              </thead>
              <tbody>
                {methods.length === 0 ? (
                  <tr>
                    <td colSpan="2" style={{ padding: '10px', textAlign: 'center' }}>{t('No payment methods found')}</td>
                  </tr>
                ) : (
                  methods.map((method, idx) => {
                    let isDisabled = false;
                    if (method === 'Cash on Delivery' && balances['Cash on Delivery'] !== undefined) {
                      // Disable if totalAmount >= COD limit
                      isDisabled = Number(totalAmount) >= Number(balances['Cash on Delivery']);
                    }

                    if (method === 'Credit' && balances['Credit'] !== undefined) {
                      // Disable if totalAmount >= Credit limit
                      isDisabled = Number(totalAmount) >= Number(balances['Credit']);
                    }


                    return (
                      <tr key={idx}>
                        <td style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>{method}</td>
                        <td style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>
                          {balances[method] !== undefined ? balances[method] : '-'}
                        </td>
                        <td style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>
                          <button
                            className="gp-product-btn"
                            onClick={() => onSelectPaymentMethod(method)}
                            disabled={isDisabled}
                          >
                            {t('Select')}
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
      {/* Reuse GetCustomers styles */}
      <style>{`
        .gp-backdrop {
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(0,0,0,0.15);
          z-index: 1000;
        }
        .gp-modal {
          position: fixed;
          top: 50%; left: 50%;
          transform: translate(-50%, -50%);
          background: #fff;
          border-radius: 12px;
          box-shadow: 0 8px 32px rgba(0,0,0,0.18);
          width: 400px;
          max-width: 95vw;
          z-index: 1001;
          padding: 0;
          animation: gp-fadein 0.2s;
        }
        @keyframes gp-fadein {
          from { opacity: 0; transform: translate(-50%, -60%);}
          to { opacity: 1; transform: translate(-50%, -50%);}
        }
        .gp-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 22px 28px 10px 28px;
        }
        .gp-title {
          font-size: 1.25rem;
          font-weight: light;
        }
        .gp-table-container {
          margin: 10px 28px;
          padding: 6px;
          border: 1.9px solid #eee;
          border-radius: 10px;
          max-height: 300px;
          overflow-y: auto;
        }
        .gp-product-btn {
          width: 100%;
          text-align: center;
          border-radius: 4px;
          background: #0a5640;
          cursor: pointer;
          border: none;
          color: white;
          padding: 6px 12px;
          font-size: 0.9rem;
          transition: background 0.15s;
        }
        .gp-product-btn:hover {
          background: #084532;
        }

        .gp-product-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .gp-close-btn {
          padding: 7px 18px;
          border-radius: 6px;
          border: 1px solid #bbb;
          background: #fff;
          color: #222;
          font-size: 1rem;
          cursor: pointer;
          transition: background 0.15s;
        }
        .gp-close-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .gp-close-btn:hover:not(:disabled) {
          background: #f2f2f2;
        }
      `}</style>
    </div>
  );
}

export default GetPaymentMethods;