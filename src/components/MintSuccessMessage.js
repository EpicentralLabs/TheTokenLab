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
    onClose,
    zkChecked
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
                    <span className="detail-label">Mint Address:</span>
                    <span className="detail-item">
                        <a href={constructMintURL(mintAddress)} target="_blank" rel="noopener noreferrer" title={mintAddress}>
                            {truncateAddress(mintAddress)}
                        </a>
                    </span>

                    <span className="detail-label">Token Account:</span>
                    <span className="detail-item">
                        <a href={constructTokenAccountURL(tokenAccount)} target="_blank" rel="noopener noreferrer" title={tokenAccount}>
                            {truncateAddress(tokenAccount)}
                        </a>
                    </span>

                    <span className="detail-label">Quantity:</span>
                    <span className="detail-item">{quantity} tokens</span>

                    <span className="detail-label">Decimals:</span>
                    <span className="detail-item">{decimals}</span>

                    <span className="detail-label">Metadata:</span>
                    <span className="detail-item">{zkChecked ? (
                                                     metadataTransactionHash ? (
                          <a href={constructMetadataURL(metadataTransactionHash)} target="_blank" rel="noopener noreferrer">
                View transaction</a>) : (
              <span>ZK Compression is not compatible with Metadata presently.</span>)) : null}
                </span>
                    <span className="detail-label">Total Charged:</span>
                    <span className="detail-item">{totalCharged} {paymentType}</span>

                    <span className="detail-label">Explorer:</span>
                    <span className="detail-item">
                        <a href={transactionLink} target="_blank" rel="noopener noreferrer">View transaction</a>
                        </span>
                </div>
                <button className="mint-success-close" onClick={onClose}>Close</button>
            </div>
        </div>
    );
}

export default MintSuccessMessage;
