import React from 'react';
import { useTranslation } from 'react-i18next';

const Table = ({
    columns,
    data,
    getStatusClass,
    actionButtons,
    customCellRenderer,
    onRowClick
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
                            <th key={column.key}>{column.header}</th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {data.map((row, index) => (
                        <tr
                            key={index}
                            onClick={() => onRowClick && onRowClick(row)}
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
        </div>
    );
};

export default Table;