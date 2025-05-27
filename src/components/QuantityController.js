import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMinus, faPlus } from '@fortawesome/free-solid-svg-icons';

const QuantityController = ({
    itemId,
    quantity = 0,
    onQuantityChange,
    onInputChange,
    stopPropagation = false,
    minQuantity = 0,  // Add minQuantity prop with default of 0
    moq = 0          // Add moq prop with default of 0
}) => {
    const handleButtonClick = (e, delta) => {
        if (stopPropagation) {
            e.stopPropagation();
        }
        
        // Prevent decreasing below MOQ
        if (delta < 0 && quantity <= moq) {
            return;
        }
        
        onQuantityChange(itemId, delta);
    };

    const handleInputChange = (e) => {
        if (stopPropagation) {
            e.stopPropagation();
        }
        
        const newValue = e.target.value === '' ? '' : parseInt(e.target.value);
        
        // Ensure the value isn't less than MOQ
        const validValue = newValue === '' ? '' : Math.max(moq, newValue);
        onInputChange(itemId, validValue);
    };

    // Disable the minus button if quantity is at or below MOQ
    const isMinusDisabled = quantity <= moq;

    return (
        <div className="quantity-controls">
            <button
                className={`quantity-btn ${isMinusDisabled ? 'disabled' : ''}`}
                onClick={(e) => handleButtonClick(e, -1)}
                disabled={isMinusDisabled}
                aria-label="Decrease quantity"
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
                onClick={(e) => stopPropagation && e.stopPropagation()}
                min={moq}  // Set the min attribute to MOQ
            />
            <button
                className="quantity-btn"
                onClick={(e) => handleButtonClick(e, 1)}
                aria-label="Increase quantity"
            >
                <FontAwesomeIcon icon={faPlus} />
            </button>
            
            {/* Add MOQ indicator if moq > 0 */}
            {moq > 0 && (
                <div className="moq-indicator" title={`Minimum Order Quantity: ${moq}`}>
                    Min: {moq}
                </div>
            )}
            
            <style>{`
                
                .quantity-controls {
                    display: flex;
                    gap: 10px;
                    align-items: center;
                    margin-bottom: 0;
                }
                .quantity-btn {
                    width: 30px;
                    height: 30px;
                    border: 1px solid #D9D9D6;
                    border-radius: 4px;
                    background: white;
                    color: #00205B;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-items: center;
                    font-size: 1rem;
                    transition: background 0.15s, color 0.15s;
                }
                .quantity-btn:hover {
                    background: #f4f4f4;
                    color: #0a5640;
                }
                .quantity-input {
                    width: 30px;
                    height: 30px;
                    text-align: center;
                    border: 1px solid #D9D9D6;
                    border-radius: 4px;
                    -webkit-appearance: none;
                    appearance: textfield;
                    -moz-appearance: textfield;
                    font-size: 1rem;
                    color: #222;
                    background: #fff;
                }
                .quantity-input::-webkit-outer-spin-button,
                .quantity-input::-webkit-inner-spin-button {
                    -webkit-appearance: none;
                    margin: 0;
                }
                
                .quantity-btn.disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                }
                .moq-indicator {
                    position: absolute;
                    bottom: -20px;
                    left: 0;
                    font-size: 0.7rem;
                    color: #666;
                    white-space: nowrap;
                }
                @media (max-width: 768px) {
                    .quantity-controls {
                        gap: 5px;
                    }
                    .quantity-btn,
                    .quantity-input {
                        width: 26px;
                        height: 26px;
                        font-size: 0.95rem;
                    }
                }
            `}</style>
        </div>
    );
};

export default QuantityController;