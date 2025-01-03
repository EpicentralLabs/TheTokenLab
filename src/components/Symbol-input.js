import React from 'react';
import './Input-list.css';



// Component for handling token symbol input
function TokenSymbolList({ zkChecked, tokenSymbol, setTokenSymbol, isError }) {
    if(zkChecked){tokenSymbol = ``}
    // Handler for symbol input changes
    const handleSymbolChange = (e) => {
        let value = e.target.value;
        // Remove any characters that are not alphanumeric or spaces
        value = value.replace(/[^a-zA-Z0-9\s]/g, '');
        // Limit the symbol length to 9 characters
        if (value.length > 9) {
            value = value.substring(0, 9);
        }

        setTokenSymbol(value);
    }

let symbolInputClass = "input-bubble";

if(zkChecked){
    symbolInputClass = "zkCompress-on-input-bubble";
}
    return (
        <h1 className="container">
            <div className="Input-bubble-box">
                <label htmlFor="token-symbol" className="input-label">Token Symbol:</label>
                <div className="input-container">
                    <input 
                        name="tokenSymbol" 
                        type="text"
                        id="token-symbol" 
                        className={`${symbolInputClass} ${isError ? 'error' : ''}`}
                        value={tokenSymbol}
                        onChange={handleSymbolChange} 
                    />
                    <div className="info-bubble">
                        <div className="tooltip">This is the "tokenSymbol symbol" (e.g., SOL, BONK, etc.).</div>
                    </div>
                </div>
            </div>
        </h1>
    );
}

export default TokenSymbolList;