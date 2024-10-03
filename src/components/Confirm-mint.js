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
function ConfirmMint({ paymentType, cost, usdValue, onConfirm, onCancel, isLoading }) {
  const costBreakdown = [
    { value: '-0.0151206', description: 'Create Metadata Account' },
    { value: '-0.00204428', description: 'Create Token Account' },
    { value: '-0.0014716', description: 'Mint Tokens' },
    { value: '-0.000005', description: 'Token Transfer to User' },
    { value: '-0.000005', description: 'Transfer Authority to User' },
  ];

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
              {costBreakdown.map((item, index) => (
                <React.Fragment key={index}>
                  <div className="cost-breakdown-value">{item.value} SOL</div>
                  <div className="cost-breakdown-description">({item.description})</div>
                </React.Fragment>
              ))}
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

