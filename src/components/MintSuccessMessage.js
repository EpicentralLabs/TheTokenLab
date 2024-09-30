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
    const extractTransactionHash = (output) => {
        const regex = /\/tx\/([a-zA-Z0-9]+)/;
        const match = output.match(regex);
        return match ? match[1] : null;
    }

    const metadataTransactionHash = extractTransactionHash(metadataUploadOutput);

    const constructMintURL = (address) => {
        const cluster = process.env.REACT_APP_SOLANA_CLUSTER ? `?cluster=${process.env.REACT_APP_SOLANA_CLUSTER}` : '?cluster=devnet';
        return `https://explorer.solana.com/address/${address}${cluster}`;
    }

    const constructTokenAccountURL = (address) => {
        const cluster = process.env.REACT_APP_SOLANA_CLUSTER ? `?cluster=${process.env.REACT_APP_SOLANA_CLUSTER}` : '?cluster=devnet';
        return `https://explorer.solana.com/address/${address}${cluster}`;
    }

    const constructMetadataURL = (hash) => {
        const cluster = process.env.REACT_APP_SOLANA_CLUSTER ? `?cluster=${process.env.REACT_APP_SOLANA_CLUSTER}` : '?cluster=devnet';
        return `https://explorer.solana.com/tx/${hash}${cluster}`;
    }

    return (
        <div className="mint-success-message fade-in">
            <h3 className="mint-success-title">🎉 Mint Successful! 🎉</h3>
            <div className="mint-success-details">
                <div className="detail-item">
                    <span className="detail-label">✅ Mint Address:</span>
                    <a href={constructMintURL(mintAddress)} target="_blank" rel="noopener noreferrer">{mintAddress}</a>
                </div>
                <hr />
                <div className="detail-item">
                    <span className="detail-label">📦 Token Account:</span>
                    <a href={constructTokenAccountURL(tokenAccount)} target="_blank" rel="noopener noreferrer">{tokenAccount}</a>
                </div>
                <hr />
                <div className="detail-item">
                    <span className="detail-label">🏷️ Quantity Minted:</span> {quantity} tokens
                </div>
                <hr />
                <div className="detail-item">
                    <span className="detail-label">🔢 Decimals:</span> {decimals}
                </div>
                <hr />
                <div className="detail-item">
                    <span className="detail-label">📄 Metadata:</span>
                    {metadataTransactionHash ? (
                        <a href={constructMetadataURL(metadataTransactionHash)} target="_blank" rel="noopener noreferrer">
                            Metadata created at: {constructMetadataURL(metadataTransactionHash)}
                        </a>
                    ) : (
                        <span>No metadata transaction found</span>
                    )}
                </div>
                <hr />
                <div className="detail-item">
                    <span className="detail-label">🔒 Freeze Checked:</span> {freezeChecked ? 'Enabled' : 'Disabled'}
                </div>
                <hr />
                <div className="detail-item">
                    <span className="detail-label">💰 Total Charged:</span> {totalCharged} {paymentType === 'SOL' ? 'lamports' : 'LABS'}
                </div>
                <hr />
                <div className="detail-item">
                    <span className="detail-label">🔗 Explorer Link:</span>
                    <a href={transactionLink} target="_blank" rel="noopener noreferrer">{transactionLink}</a>
                </div>
            </div>
        </div>
    );
}

export default MintSuccessMessage;
