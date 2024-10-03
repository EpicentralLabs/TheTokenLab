import React from 'react';
import './Confirm-mint.css';

// Define the props type for ConfirmMint component
interface ConfirmMintProps {
    paymentType: string;   // Type for payment type (e.g., 'SOL' or 'LABS')
    cost: number;          // Type for cost (should be a number)
    usdValue: number;      // Type for USD value (should be a number)
    onConfirm: () => void; // Function to call when confirming
    onCancel: () => void;  // Function to call when cancelling
    isLoading: boolean;    // Boolean indicating loading state
    isSuccess: boolean;    // Boolean indicating success state
}

// ConfirmMint component
const ConfirmMint: React.FC<ConfirmMintProps> = ({
                                                     paymentType,
                                                     cost,
                                                     usdValue,
                                                     onConfirm,
                                                     onCancel,
                                                     isLoading,
                                                     isSuccess,
                                                 }) => {
    return (
        <div className="confirm-mint-overlay">
            <div className="confirm-mint-popup">
                {isSuccess ? (
                    <div>
                        <h2>Mint Successful!</h2>
                        <p>Your token has been successfully minted.</p>
                        <div className="confirm-mint-buttons">
                            <button className="confirm-mint-button confirm" onClick={onCancel}>
                                Close
                            </button>
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
                                    <button className="confirm-mint-button confirm" onClick={onConfirm}>
                                        Confirm
                                    </button>
                                    <button className="confirm-mint-button cancel" onClick={onCancel}>
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ConfirmMint;
