import React from 'react';
import './Confirm-mint.css';

function ConfirmMint({ paymentType, cost, usdValue, onConfirm, onCancel, isLoading }) {
  return (
    <div className="confirm-mint-overlay">
      <div className="confirm-mint-popup">
        {isLoading ? (
          <div className="confirm-mint-loading">
            <div className="confirm-mint-spinner"></div>
            <p>Processing mint transaction...</p>
          </div>
        ) : (
          <div>
            <h2>Confirm Mint Initialization?</h2>
            <p>You are about to mint some tokens! Here is the fee breakdown:</p>
            <p className="confirm-mint-cost">
              {cost} {paymentType}
              <span className="confirm-mint-usd-value">(≈ ${usdValue})</span>
            </p>
            <div className="cost-breakdown">
              <div className="cost-breakdown-item">-0.0151206 SOL (Create Metadata Account)</div>
              <div className="cost-breakdown-item">-0.00204428 SOL (Create Token Account)</div>
              <div className="cost-breakdown-item">-0.0014716 SOL (Mint Tokens)</div>
              <div className="cost-breakdown-item">-0.000005 SOL (Token Transfer to User)</div>
              <div className="cost-breakdown-item">-0.000005 SOL (Transfer Authority to User)</div>
            </div>
            <div className="confirm-mint-buttons">
              <button className="confirm-mint-button confirm" onClick={onConfirm}>Confirm</button>
              <button className="confirm-mint-button cancel" onClick={onCancel}>Cancel</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ConfirmMint;