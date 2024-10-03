import React from 'react';
import './Input-list.css';

// QuantityInput component for handling token quantity input
function QuantityInput({ quantity, setQuantity, isError }) {
    const maxValue = 1000000000000;
    const minValue = 1;

    const formatNumber = (num) => {
        return num.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }

    const handleChange = (e) => {
        let value = e.target.value;
        value = value.replace(/[^0-9]/g, '');

        if (value) {
            const numericValue = parseInt(value, 10);
            if (numericValue > maxValue) {
                value = maxValue.toString();
            }
            setQuantity(formatNumber(value));
        } else {
            setQuantity('');
        }
        setQuantity(value);
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
                        value={formatNumber(quantity)}
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