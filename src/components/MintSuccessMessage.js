import React from 'react';
import './MintSuccessMessage.css';

function MintSuccessMessage({
                                mintAddress,
                                tokenAccount,
                                quantity,
                                decimals,
                                metadataUploadOutput,
                                freezeChecked,
                                totalCharged,
                                paymentType,
                                transactionLink,
                            }) {
    return (
        <div className="mint-success-message fade-in">
            <h3 className="mint-success-title">🎉 Mint Successful! 🎉</h3>
            <div className="mint-success-details">
                <div className="detail-item">
                    <span className="detail-label">✅ Mint Address:</span> {mintAddress}
                </div>
                <div className="detail-item">
                    <span className="detail-label">📦 Token Account:</span> {tokenAccount}
                </div>
                <div className="detail-item">
                    <span className="detail-label">🏷️ Quantity Minted:</span> {quantity} tokens
                </div>
                <div className="detail-item">
                    <span className="detail-label">🔢 Decimals:</span> {decimals}
                </div>
                <div className="detail-item">
                    <span className="detail-label">📄 Metadata:</span> {metadataUploadOutput}
                </div>
                <div className="detail-item">
                    <span className="detail-label">🔒 Freeze Checked:</span> {freezeChecked ? 'Enabled' : 'Disabled'}
                </div>
                <div className="detail-item">
                    <span className="detail-label">💰 Total Charged:</span> {totalCharged} {paymentType === 'SOL' ? 'lamports' : 'LABS'}
                </div>
                <div className="detail-item">
                    <span className="detail-label">🔗 Explorer Link:</span>
                    <a href={transactionLink} target="_blank" rel="noopener noreferrer">{transactionLink}</a>
                </div>
            </div>
        </div>
    );
}

export default MintSuccessMessage;
