import React from 'react';
import { useTranslation } from 'react-i18next';

const Table = ({ 
    columns, 
    data, 
    getStatusClass, 
    actionButtons,
    customCellRenderer 
}) => {
    const { t } = useTranslation();

    const renderCell = (item, column) => {
        // If there's a custom renderer for this column, use it
        if (customCellRenderer && customCellRenderer[column.key]) {
            return customCellRenderer[column.key](item);
        }

        // Handle nested objects (e.g., primaryContact.email)
        if (column.key.includes('.')) {
            const keys = column.key.split('.');
            let value = item;
            for (const key of keys) {
                value = value[key];
            }
            return value;
        }

        // Handle status badges
        if (column.key === 'status' && getStatusClass) {
            return (
                <span className={`status-badge ${getStatusClass(item[column.key])}`}>
                    {t(item[column.key])}
                </span>
            );
        }

        // Handle action buttons
        if (column.key === 'actions' && actionButtons) {
            return actionButtons(item);
        }

        // Default cell rendering
        return item[column.key];
    };

    return (
        <div className="table-container">
            <table className="data-table">
                <thead>
                    <tr>
                        {columns.map((column) => (
                            <th key={column.key} scope="col">{t(column.header)}</th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {data.map((item, index) => (
                        <tr key={item.id || index}>
                            {columns.map((column) => (
                                <td key={`${item.id || index}-${column.key}`}>
                                    {renderCell(item, column)}
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
                    border-radius: 4px;
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
    );
};

export default Table;