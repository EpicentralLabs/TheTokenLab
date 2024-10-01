import React from 'react';
import './Confirm-mint.css';

function ConfirmMint({ paymentType, cost, usdValue, onConfirm, onCancel, isLoading, isSuccess }) {
  return (
    <div className="confirm-mint-overlay">
      <div className="confirm-mint-popup">
        {isSuccess ? (
          <div>
            <h2>Mint Successful!</h2>
            <p>Your token has been successfully minted.</p>
            <div className="confirm-mint-buttons">
              <button className="confirm-mint-button confirm" onClick={onCancel}>Close</button>
            </div>
          </div>
        ) : (
          <div>
            <h2>Confirm Mint Initialization</h2>
            {isLoading ? (
              <div className="confirm-mint-loading">
                <div className="confirm-mint-spinner"></div>
                <p>Processing mint...</p>
              </div>
            ) : (
              <div>
                <p>You are about to initialize a mint with the following cost:</p>
                <p className="confirm-mint-cost">
                  {cost} {paymentType}
                  <span className="confirm-mint-usd-value">(≈ ${usdValue})</span>
                </p>
                <div className="confirm-mint-buttons">
                  <button className="confirm-mint-button confirm" onClick={onConfirm}>Confirm</button>
                  <button className="confirm-mint-button cancel" onClick={onCancel}>Cancel</button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default ConfirmMint;
