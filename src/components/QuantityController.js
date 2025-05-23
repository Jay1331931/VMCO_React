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