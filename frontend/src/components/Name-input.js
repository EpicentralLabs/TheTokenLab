import React from 'react';
import './Input-list.css';

// Component for handling token name input
function TokenNameList({ tokenName, setTokenName, isError }) {
    // Handler for token name input changes
    const handleNameChange = (e) => {
        let value = e.target.value;
        // Remove any characters that are not alphanumeric or spaces
        value = value.replace(/[^a-zA-Z0-9\s]/g, '');
        // Limit the token name to 32 characters
        if (value.length > 32) {
            value = value.substring(0, 32);
        }

        setTokenName(value);
    }

    return (
        <h1 className="container">
            <div className="Input-bubble-box">
                <label htmlFor="token-name" className="input-label">Token Name: </label>
                <div className="input-container">
                    <input 
                        name="tokenName" 
                        type="text"
                        id="token-name" 
                        className={`input-bubble ${isError ? 'error' : ''}`}
                        value={tokenName}
                        onChange={handleNameChange} 
                    />
                    {/* Info bubble with tooltip */}
                    <div className="info-bubble">
                        <div className="tooltip">This is the full name of your token or project.</div>
                    </div>
                </div>
            </div>
        </h1>
    );
}

export default TokenNameList;