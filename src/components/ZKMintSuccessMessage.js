import React from 'react';
import './MintSuccessMessage.css';

function MintSuccessMessage({
    mintAddress,
    tokenAccount,
    quantity,
    decimals,
    metadataUploadOutput,
    totalCharged,
    paymentType,
    transactionLink,
    onClose
}) {
    const extractTransactionHash = (output) => {
        const regex = /\/tx\/([a-zA-Z0-9]+)/;
        if(output){
            const match = output.match(regex);
            return match ? match[1] : null;
        }else{
            return 'zk compression'
        };
        
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

    const truncateAddress = (address) => {
        if (address.length > 8) {
            return `${address.slice(0, 4)}....${address.slice(-4)}`;
        }
        return address;
    };

    return (
        <div className="mint-success-overlay">
            <div className="mint-success-message">
                <h3 className="mint-success-title">🎉 Mint Successful! 🎉</h3>
                <div className="mint-success-details">
                    <span className="detail-label">Mint Address: {mintAddress}</span>
                    
                </div>
                <button className="mint-success-close" onClick={onClose}>Close</button>
            </div>
        </div>
    );
}

export default MintSuccessMessage;
