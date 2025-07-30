import React from 'react';
import { useTranslation } from 'react-i18next';
import Constants from '../constants';

const Table = ({
    columns,
    data,
    getStatusClass,
    actionButtons,
    customCellRenderer,
    onRowClick,
    onPay,
}) => {
    const { t } = useTranslation();
 const isDateString = (val) => {
        if (val instanceof Date) return true;
        if (typeof val === "string") {
            // Matches YYYY-MM-DD or YYYY-MM-DDTHH:mm:ssZ
            return /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(.\d+)?(Z|([+-]\d{2}:\d{2}))?)?$/.test(val);
        }
        return false;
    };
    const renderCell = (item, column) => {
        // If there's a custom renderer for this column, use it
        if (customCellRenderer && customCellRenderer[column.key]) {
            return customCellRenderer[column.key](item);
        }

        if(column?.render){
            return column.render(item);
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
        if(column.key.toLowerCase() ==="paymentstatus"){
            return (
                <span >
                    {t(item[column.key])}
                </span>
            );
        }
        if (column.key?.toLowerCase() === 'paymentmethod') {
            return (
                <span >
                    {t(item[column.key])}
                </span>
            );
        }

        // Handle action buttons
        if (column.key === 'actions' && actionButtons) {
            return actionButtons(item);
        }
          // Handle pay button
        if (column.key.toLowerCase() === 'pay' && onPay &&
            item?.paymentMethod?.toLowerCase()!="cash on delivery"&& item.paymentStatus?.toLowerCase() !== 'paid'  
        && (item.status?.toLowerCase() === 'approved' || (item.status?.toLowerCase() === 'open' 
        && (item.entity.toLowerCase()===Constants.ENTITY.DAR.toLowerCase() ||item.entity.toLowerCase()===Constants.ENTITY.GMTC.toLowerCase()|| item.entity.toLowerCase()===Constants.ENTITY.SHC.toLowerCase()  ) ) || 
        (item.status?.toLowerCase() === 'pending' && item.entity.toLowerCase()===Constants.ENTITY.NAQI.toLowerCase() ))) {
            return (
                <button 
                    className="action-button pay"
                    onClick={(e) => {
                        console.log('Pay button clicked for item:', item);
                        e.stopPropagation(); // Prevent row click event
                        onPay(item,false);
                    }}
                >
                    {t('Pay')}
                </button>
            );
        }
        if (column.key?.toLowerCase() === 'sendlink'  && 
            item?.paymentMethod?.toLowerCase()!="cash on delivery"&& item.paymentStatus?.toLowerCase() !== 'paid'  
        && (item.status?.toLowerCase() === 'approved'  || (item.status?.toLowerCase() === 'open' 
        && (item.entity.toLowerCase()===Constants.ENTITY.DAR.toLowerCase() ||item.entity.toLowerCase()===Constants.ENTITY.GMTC.toLowerCase()|| item.entity.toLowerCase()===Constants.ENTITY.SHC.toLowerCase()  ) ) || 
        (item.status?.toLowerCase() === 'pending' && (item.entity.toLowerCase()===Constants.ENTITY.NAQI.toLowerCase() )))) {
            return (
                <button 
                    className="action-button pay"
                    onClick={(e) => {
                        console.log('Pay button clicked for item:', item);
                        e.stopPropagation(); // Prevent row click event
                        onPay(item,true);
                    }}
                >
                    {t('Send Link')}
                </button>
            );
        }

        
   const value = item[column.key];

    // If value is an object, stringify it
   if (typeof value === 'object' && value !== null) {
        return JSON.stringify(value);
    }
    // Identify whether value string is a date

    if (isDateString(value)) {
        // Format date if needed, or just return value
        // return in dd/mm/yyyy format
        const date = new Date(value);
        if (isNaN(date.getTime())) return value; // Invalid date
        // Format date to dd/mm/yyyy
        return new Intl.DateTimeFormat('en-GB', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
        }).format(date);
    }
        
    // Default cell rendering
    return item[column.key];
    };
 
    return (
        <div className="table-container">
            <table className="data-table">               
                 <thead>
                    <tr>
                        {columns.map((column) => (                            <th key={column.key}>
                                {typeof column.header === 'function' 
                                    ? column.header() 
                                    : t(column.header)}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {data.map((row, index) => (                        <tr
                            key={index}
                            onClick={(e) => {
                                if (onRowClick) {
                                    console.log('Table component: row clicked', row);
                                    onRowClick(row);
                                }
                            }}
                            style={{ cursor: onRowClick ? 'pointer' : 'default' }}
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
    );
};

export default Table;