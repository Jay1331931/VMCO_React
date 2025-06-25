import React from 'react';
import { useTranslation } from 'react-i18next';

function Remarks({ open, onClose }) {
    const {t} = useTranslation();
    if (!open) return null;

    return (
        <div>
            <div className="remarks-backdrop" />
            <div className="remarks-modal">
                <div className="remarks-header">
                    <span className="remarks-title">{t("Remarks")}</span>
                    <button className="remarks-close" onClick={onClose}>&times;</button>
                </div>
                <div className="remarks-input-container">
                    <input className="remarks-input" type="text" placeholder="Enter remarks here..." />
                </div>
                <div className="remarks-footer">
                    <button className="remarks-approve-btn" onClick={onClose}>{t("Approve")}</button>
                </div>
            </div>

            <style>{`
                .remarks-backdrop {
                    position: fixed;
                    top: 0; left: 0; right: 0; bottom: 0;
                    background: rgba(0,0,0,0.15);
                    z-index: 1000;
                }
                .remarks-modal {
                    position: fixed;
                    top: 50%; left: 50%;
                    transform: translate(-50%, -50%);
                    background: #fff;
                    border-radius: 16px;
                    box-shadow: 0 8px 32px rgba(0,0,0,0.18);
                    width: 540px;
                    max-width: 95vw;
                    z-index: 1001;
                    padding: 0;
                    animation: remarks-fadein 0.2s;
                }
                @keyframes remarks-fadein {
                    from { opacity: 0; transform: translate(-50%, -60%);}
                    to { opacity: 1; transform: translate(-50%, -50%);}
                }
                .remarks-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 32px 36px 0 36px;
                }
                .remarks-title {
                    font-size: 1.5rem;
                    font-weight: 400;
                }
                .remarks-close {
          background: none;
          border: none;
          font-size: 1.5rem;
          cursor: pointer;
          color: #888;
        }
                .remarks-input-container {
                    margin: 32px 36px 0 36px;
                }
                .remarks-input {
                    width: 100%;
                    font-size: 1.2rem;
                    padding: 14px 18px;
                    border-radius: 10px;
                    border: 1.5px solid #ddd;
                    outline: none;
                    background: #fff;
                    transition: border 0.2s;
                }
                .remarks-input:focus {
                    border: 1.5px solid #0a5640;
                }
                .remarks-footer {
                    display: flex;
                    justify-content: flex-end;
                    padding: 36px 36px 36px 36px;
                }
                .remarks-approve-btn {
                    padding: 14px 48px;
                    border-radius: 8px;
                    border: none;
                    background: #0a5640;
                    color: #fff;
                    font-size: 1.2rem;
                    cursor: pointer;
                    font-weight: 400;
                    transition: background 0.15s;
                }
                .remarks-approve-btn:hover {
                    background: #084c37;
                }
            `}</style>
        </div>
    );
}

export default Remarks;