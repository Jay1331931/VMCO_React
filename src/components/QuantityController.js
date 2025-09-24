import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMinus, faPlus } from '@fortawesome/free-solid-svg-icons';
import { useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Swal from 'sweetalert2';

const QuantityController = ({
    itemId,
    quantity = 0,
    onQuantityChange,
    onInputChange,
    stopPropagation = false,
    minQuantity = 0,
    moq = 0
}) => {
    const timeoutRef = useRef(null);
    const { t, i18n } = useTranslation();
    
    // Use multiple methods to detect RTL/Arabic
    const currentLanguage = i18n.language;
    const dir = i18n.dir();
    const isRTL = dir === 'rtl' || currentLanguage === 'ar' || i18n.language === 'ar';

    console.log('QuantityController Debug:', {
        currentLanguage,
        dir,
        isRTL,
        language: i18n.language
    });

    const showMOQWarning = () => {
        Swal.fire({
            title: t('Minimum Order Quantity'),
            text: t('The quantity is below the minimum order quantity'),
            icon: 'warning',
            showConfirmButton: false,
            timer: 1000,
            backdrop: true,
            allowOutsideClick: true
        }).then(() => {
            // After the alert is shown, reset quantity to MOQ
            onInputChange(itemId, moq);
        });
    };

    const clearValidationTimeout = () => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }
    };

    const validateQuantityWithDelay = (currentQuantity) => {
        // Clear any existing timeout
        clearValidationTimeout();
        
        // Only validate if quantity is a valid number, below MOQ and MOQ is greater than 0
        const numQuantity = typeof currentQuantity === 'number' ? currentQuantity : parseInt(currentQuantity);
        if (!isNaN(numQuantity) && numQuantity < moq && moq > 0) {
            timeoutRef.current = setTimeout(() => {
                showMOQWarning();
            }, 3000); // 3 seconds delay
        }
    };

    const handleButtonClick = (e, delta) => {
        if (stopPropagation) {
            e.stopPropagation();
        }
        
        // Clear any pending validation timeout when user interacts
        clearValidationTimeout();
        
        // Allow all operations, no restrictions on button clicks
        onQuantityChange(itemId, delta);
        
        // Set up validation for the new quantity
        const currentQty = typeof quantity === 'number' ? quantity : parseInt(quantity) || 0;
        const newQuantity = currentQty + delta;
        validateQuantityWithDelay(newQuantity);
    };

    const handleInputChange = (e) => {
        if (stopPropagation) {
            e.stopPropagation();
        }
        
        // Clear any pending validation timeout when user types
        clearValidationTimeout();
        
        const inputValue = e.target.value;
        
        // Handle completely empty input (backspace to empty)
        if (inputValue === '') {
            onInputChange(itemId, '');
            return;
        }
        
        // Handle negative signs and partial inputs - allow while typing
        if (inputValue === '-' || inputValue.match(/^-?\d*$/)) {
            // Allow temporary states while typing, pass the exact input value
            onInputChange(itemId, inputValue);
            
            // Only validate if it's a complete valid number
            const numValue = parseInt(inputValue);
            if (!isNaN(numValue)) {
                validateQuantityWithDelay(numValue);
            }
            return;
        }
        
        // If input contains non-numeric characters, ignore it
        // This prevents the input from accepting invalid characters
    };

    const handleInputBlur = () => {
        // Clear existing timeout
        clearValidationTimeout();
        
        // Convert empty strings or invalid values to MOQ on blur
        if (quantity === '' || quantity === '-' || isNaN(parseInt(quantity))) {
            onInputChange(itemId, moq || 0);
            return;
        }
        
        // Validate immediately on blur if quantity is below MOQ
        const finalQuantity = typeof quantity === 'number' ? quantity : parseInt(quantity) || 0;
        if (finalQuantity < moq && moq > 0) {
            showMOQWarning();
        }
    };

    const handleInputFocus = () => {
        // Clear any pending validation when user focuses back on input
        clearValidationTimeout();
    };

    // Cleanup timeout on unmount
    useEffect(() => {
        return () => {
            clearValidationTimeout();
        };
    }, []);

    return (
        <div className="quantity-controls">
            {isRTL ? (
                // Arabic (RTL) layout: + button first, then input, then - button
                <>
                    <button
                        className="quantity-btn-2"
                        onClick={(e) => handleButtonClick(e, 1)}
                        aria-label={t("Increase quantity")}
                    >
                        <FontAwesomeIcon icon={faPlus} />
                    </button>
                    <input
                        type="text"
                        className="quantity-input"
                        id={`quantity-${itemId}`}
                        name={`quantity-${itemId}`}
                        value={quantity === 0 && moq > 0 ? moq : quantity}
                        onChange={handleInputChange}
                        onBlur={handleInputBlur}
                        onFocus={handleInputFocus}
                        onClick={(e) => stopPropagation && e.stopPropagation()}
                        style={{
                            border:"none",
                            width:"40px",
                            textAlign: "center",
                            direction: 'ltr' // Keep numbers LTR even in RTL layout
                        }}
                    />
                    <button
                        style={{background:"#d2d2d2"}}
                        className="quantity-btn"
                        onClick={(e) => handleButtonClick(e, -1)}
                        aria-label={t("Decrease quantity")}
                    >
                        <FontAwesomeIcon icon={faMinus} />
                    </button>
                </>
            ) : (
                // English (LTR) layout: - button first, then input, then + button
                <>
                    <button
                        style={{background:"#d2d2d2"}}
                        className="quantity-btn"
                        onClick={(e) => handleButtonClick(e, -1)}
                        aria-label={t("Decrease quantity")}
                    >
                        <FontAwesomeIcon icon={faMinus} />
                    </button>
                    <input
                        type="text"
                        className="quantity-input"
                        id={`quantity-${itemId}`}
                        name={`quantity-${itemId}`}
                        value={quantity === 0 && moq > 0 ? moq : quantity}
                        onChange={handleInputChange}
                        onBlur={handleInputBlur}
                        onFocus={handleInputFocus}
                        onClick={(e) => stopPropagation && e.stopPropagation()}
                        style={{
                            border:"none",
                            width:"40px",
                            textAlign: "center",
                            direction: 'ltr' // Keep numbers LTR
                        }}
                    />
                    <button
                        className="quantity-btn-2"
                        onClick={(e) => handleButtonClick(e, 1)}
                        aria-label={t("Increase quantity")}
                    >
                        <FontAwesomeIcon icon={faPlus} />
                    </button>
                </>
            )}
            
            <style>{`
                .quantity-controls {
                    display: flex;
                    gap: 0px;
                    align-items: center;
                    margin-bottom: 0;
                }
                .quantity-btn {
                    width: 30px;
                    height: 30px;
                    border: 1px solid #b2c2d8;
                    border-radius: 4px;
                    background: #d2d2d2;
                    color: black;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 1rem;
                    transition: background 0.15s, color 0.15s;
                }
                .quantity-btn-2 {
                    width: 30px;
                    height: 30px;
                    border: 1px solid var(--logo-deep-green, #0a5640);
                    border-radius: 4px;
                    background: var(--logo-deep-green, #0a5640);
                    color: white;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 1rem;
                    transition: background 0.15s, color 0.15s;
                }
                .quantity-btn:hover {
                    background: #c0c0c0;
                    color: var(--logo-deep-green, #0a5640);
                }
                .quantity-btn-2:hover {
                    background: #0d6b4f;
                }
                .quantity-input {
                    height: 30px;
                    text-align: center;
                    border-radius: 4px;
                    -webkit-appearance: none;
                    appearance: textfield;
                    -moz-appearance: textfield;
                    font-size: 1rem;
                    color: #222;
                    background: #fff;
                }
                .quantity-input:focus {
                    outline: none;
                    box-shadow: none;
                    border: none;
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
                    .quantity-btn-2,
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
