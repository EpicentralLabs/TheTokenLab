import React from 'react';
import './Input-list.css';

// QuantityInput component for handling token quantity input
function QuantityInput({ quantity, setQuantity, isError }) {
    // Maximum allowed value for quantity (1 trillion)
    const maxValue = 1000000000000;

    // Format number with commas
    const formatNumber = (num) => {
        return num.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }

    // Handler for input change
    const handleChange = (e) => {
        let value = e.target.value;

        // Remove non-digit characters for validation
        const numericValue = value.replace(/[^\d]/g, '');

        if (numericValue === '' || (parseInt(numericValue, 10) <= maxValue)) {
            // Format the numeric value with commas
            const formattedValue = formatNumber(numericValue);
            setQuantity(formattedValue);
        }
    }

    return (
        <h1 className="container">
            <div className="Input-bubble-box">
                <label htmlFor="token-quantity" className="input-label">Quantity:</label>
                <div className="input-container">
                    <input
                        name="quantity"
                        type="text"
                        id="quantity"
                        className={`input-bubble ${isError ? 'error' : ''}`}
                        value={quantity}
                        onChange={handleChange}
                    />
                    {/* Info bubble with tooltip */}
                    <div className="info-bubble">
                        <div className="tooltip">The quantity of tokens you wish to mint.</div>
                    </div>
                </div>
            </div>
        </h1>
    );
}

export default QuantityInput;
