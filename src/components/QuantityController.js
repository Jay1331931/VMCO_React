import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMinus, faPlus } from '@fortawesome/free-solid-svg-icons';

const QuantityController = ({ 
    itemId, 
    quantity = 0, 
    onQuantityChange, 
    onInputChange,
    stopPropagation = false 
}) => {
    const handleButtonClick = (e, delta) => {
        if (stopPropagation) {
            e.stopPropagation();
        }
        onQuantityChange(itemId, delta);
    };

    const handleInputChange = (e) => {
        if (stopPropagation) {
            e.stopPropagation();
        }
        onInputChange(itemId, Math.max(0, parseInt(e.target.value) || 0));
    };

    return (
        <div className="quantity-controls">
            <button
                className="quantity-btn"
                onClick={(e) => handleButtonClick(e, -1)}
            >
                <FontAwesomeIcon icon={faMinus} />
            </button>
            <input
                type="number"
                className="quantity-input"
                id={`quantity-${itemId}`}
                name={`quantity-${itemId}`}
                value={quantity}
                onChange={handleInputChange}
            />
            <button
                className="quantity-btn"
                onClick={(e) => handleButtonClick(e, 1)}
            >
                <FontAwesomeIcon icon={faPlus} />
            </button>
        </div>
    );
};

export default QuantityController;