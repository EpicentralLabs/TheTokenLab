import React from 'react';
import './Input-list.css';

// Define the props interface for TokenSymbolList component
interface TokenSymbolListProps {
    tokenSymbol: string;
    setTokenSymbol: (symbol: string) => void;
    isError: boolean;
}

// Component for handling token symbol input
const TokenSymbolList: React.FC<TokenSymbolListProps> = ({ tokenSymbol, setTokenSymbol, isError }) => {
    // Handler for symbol input changes
    const handleSymbolChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let value = e.target.value;
        // Remove any characters that are not alphanumeric or spaces
        value = value.replace(/[^a-zA-Z0-9\s]/g, '');
        // Limit the symbol length to 9 characters
        if (value.length > 9) {
            value = value.substring(0, 9);
        }

        setTokenSymbol(value);
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
                        className={`input-bubble ${isError ? 'error' : ''}`}
                        value={tokenSymbol}
                        onChange={handleSymbolChange}
                    />
                    <div className="info-bubble">
                        <div className="tooltip">This is the "token symbol" (e.g., SOL, BONK, etc.).</div>
                    </div>
                </div>
            </div>
        </h1>
    );
}

export default TokenSymbolList;
