import React from 'react';
import './Input-list.css';

// Define the props type for QuantityInput component
interface QuantityInputProps {
    quantity: number;        // The quantity should be a string to allow formatted numbers
    setQuantity: (value: string) => void; // Function to update the quantity
    isError?: boolean;       // Optional error flag
}

// QuantityInput component
const QuantityInput: React.FC<QuantityInputProps> = ({ quantity, setQuantity, isError }) => {
    const maxValue = 1000000000000;

    // Function to format the number with commas
    const formatNumber = (num: string | number): string => {
        if (typeof num !== 'string') {
            num = num.toString();
        }
        return num.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    };
    const handleQuantityChange = (value: string) => {
        setQuantity(value); // This now correctly takes a string
    };
    // Handle input change event
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let value = e.target.value;
        value = value.replace(/[^0-9]/g, ''); // Remove non-numeric characters

        if (value) {
            const numericValue = parseInt(value, 10);
            if (numericValue > maxValue) {
                value = maxValue.toString();
            }
            setQuantity(numericValue > 0 ? formatNumber(numericValue) : '');
        } else {
            setQuantity('');
        }
    };

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
                        value={quantity} // This is already formatted
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
};

export default QuantityInput;
