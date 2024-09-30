import React from 'react';
import './MintSuccessMessage.css';

function MintSuccessMessage({ mintAddress, tokenAccount, quantity, decimals, metadataUploadOutput, freezeChecked, totalCharged, paymentType, transactionLink }) {
    return (
        <div className="mint-success-message fade-in">
            <h3 className="mint-success-title">🎉 Mint Successful! 🎉</h3>
            <ul>
                <li>✅ Mint Address: {mintAddress}</li>
                <li>📦 Token Account: {tokenAccount}</li>
                <li>🏷️ Quantity Minted: {quantity} tokens</li>
                <li>🔢 Decimals: {decimals}</li>
                <li>📄 Metadata: {metadataUploadOutput}</li>
                <li>🔒 Freeze Checked: {freezeChecked ? 'Enabled' : 'Disabled'}</li>
                <li>💰 Total Charged: {totalCharged} {paymentType === 'SOL' ? 'lamports' : 'LABS'}</li>
                <li>🔗 Explorer Link: <a href={transactionLink} target="_blank" rel="noopener noreferrer">{transactionLink}</a></li>
            </ul>
        </div>
    );
}

export default MintSuccessMessage;
