import React, { useState, useEffect } from 'react';
import './Initialize-mint.css';
import ErrorMessage from './Error-message';
import SuccessMessage from './InitalizingMint-message';
import ConfirmMint from './Confirm-mint';
import {Connection, Transaction, SystemProgram, Keypair, clusterApiUrl} from '@solana/web3.js';
const bs58 = require('bs58');

function InitializeMint({
                          tokenName,
                          tokenSymbol,
                          quantity,
                          decimals,
                          setIsTokenNameError,
                          setIsTokenSymbolError,
                          setIsQuantityError,
                          setIsDecimalsError,
                          onSolMintClick,
                          onLabsMintClick,
                          userPublicKey,
                          payerPublicKey
                        }) {
  const [solPrice, setSolPrice] = useState(null);
  const [labsPrice, setLabsPrice] = useState(null);
  const [showError, setShowError] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showConfirmPopup, setShowConfirmPopup] = useState(false);
  const [selectedPaymentType, setSelectedPaymentType] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [dappEncryptionPublicKey, setDappEncryptionPublicKey] = useState(null);
  const [session, setSession] = useState(null);
  const [nonce, setNonce] = useState(null);

  useEffect(() => {
    const fetchPrices = async () => {
      const options = {
        method: 'GET',
        headers: { 'X-API-KEY': `4d9a32c538a44ddd8fb7ad6d14aadec5` }
      };

      try {
        const solResponse = await fetch('https://public-api.birdeye.so/defi/price?address=So11111111111111111111111111111111111111112', options);
        const solData = await solResponse.json();
        setSolPrice(solData.data.value);

        const labsResponse = await fetch('https://public-api.birdeye.so/defi/price?address=LABSh5DTebUcUbEoLzXKCiXFJLecDFiDWiBGUU1GpxR', options);
        const labsData = await labsResponse.json();
        setLabsPrice(labsData.data.value);
      } catch (err) {
        console.error('Error fetching prices:', err);
      }
    };

    fetchPrices().then(r => console.log('Prices fetched successfully'));
  }, []);

  const calculateUsdValue = (quantity, price) => {
    if (price) {
      return (quantity * price).toFixed(2);
    }
    return '...';
  };

  const handleInitializeMint = (paymentType) => {
    let hasError = false;

    if (!tokenName.trim()) {
      setIsTokenNameError(true);
      hasError = true;
    }
    if (!tokenSymbol.trim()) {
      setIsTokenSymbolError(true);
      hasError = true;
    }
    if (!quantity.trim()) {
      setIsQuantityError(true);
      hasError = true;
    }
    if (!decimals.trim()) {
      setIsDecimalsError(true);
      hasError = true;
    }

    if (hasError) {
      setShowError(true);
      setShowSuccess(false);
    } else {
      setShowError(false);
      setSelectedPaymentType(paymentType);
      setShowConfirmPopup(true);
    }
  };
  const getLamports = (paymentType, quantity) => {
    if (paymentType === 'SOL') {
      const solValueInUSD = solPrice; // Use the fetched SOL price in USD
      const usdValue = calculateUsdValue(quantity, solValueInUSD); // Convert quantity to USD
      return Math.round((usdValue / solValueInUSD) * 1e9); // Convert USD to lamports
    } else if (paymentType === 'LABS') {
      const labsValueInUSD = labsPrice; // Use the fetched LABS price in USD
      const usdValue = calculateUsdValue(quantity, labsValueInUSD); // Convert quantity to USD
      return Math.round((usdValue / labsValueInUSD) * 5000); // Convert USD to LABS lamports
    }
    return 0; // Default case if paymentType is unknown
  };
  const handleConfirm = async () => {
    setIsLoading(true);
    let transaction = null; // Initialize transaction variable

    try {
      const rpcEndpoint = process.env.CUSTOM_RPC_ENDPOINT;
      const connection = new Connection(rpcEndpoint || clusterApiUrl('devnet'), 'confirmed');
      const lamports = getLamports(selectedPaymentType, quantity);

      // Create and prepare the transaction
      transaction = new Transaction().add(
          SystemProgram.transfer({
            fromPubkey: payerPublicKey,
            toPubkey: userPublicKey,
            lamports: lamports,
          })
      );

      // Set the fee payer and recent blockhash
      transaction.feePayer = userPublicKey;
      transaction.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;

      const serializedTransaction = transaction.serializeMessage();
      const transactionBase58 = bs58.encode(serializedTransaction);

      const payload = {
        transaction: transactionBase58,
        sendOptions: {},
        session: session,
      };

      const response = await fetch(`https://phantom.app/ul/v1/signAndSendTransaction?dapp_encryption_public_key=${dappEncryptionPublicKey}&nonce=${nonce}&redirect_link=${encodeURIComponent(window.location.href)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          payload: JSON.stringify(payload),
        }),
      });

      const result = await response.json();

      if (response.ok) {
        console.log('Transaction signature:', result.data);
        setIsSuccess(true);
      } else {
        console.error('Transaction failed:', result.errorMessage);
        setIsSuccess(false);
      }
    } catch (error) {
      console.error('Minting failed:', error);
      setIsSuccess(false);
    } finally {
      setIsLoading(false);
      if (transaction) {
        return {
          tokenName,
          tokenSymbol,
          quantity,
          decimals,
          paymentType: selectedPaymentType,
          isSuccess,
          transaction, // Optionally return the transaction
        };
      }
    }
  };

  const handleCancel = () => {
    setShowConfirmPopup(false);
    setIsSuccess(false);
    setIsLoading(false);
  };

  useEffect(() => {
    setIsTokenNameError(false);
    setIsTokenSymbolError(false);
    setIsQuantityError(false);
    setIsDecimalsError(false);
    setShowError(false);
    setShowSuccess(false);
  }, [tokenName, tokenSymbol, quantity, decimals]);

  return (
      <div className="initialize-mint">
        <h2 className="initialize-mint-title">Initialize Mint:</h2>
        <div className="initialize-mint-button-container">
          <button className="initialize-mint-button" onClick={() => handleInitializeMint('SOL')}>
            0.05 SOL
            <span className="initialize-mint-subtext">(≈ ${calculateUsdValue(0.05, solPrice)})</span>
          </button>
          <span className="initialize-mint-or-text">or</span>
          <button className="initialize-mint-button" onClick={() => handleInitializeMint('LABS')}>
            <span>5,000 LABS</span>
            <span className="initialize-mint-subtext">(≈ ${calculateUsdValue(5000, labsPrice)})</span>
          </button>
        </div>
        {showError && <ErrorMessage />}
        {showSuccess && <SuccessMessage />}
        {showConfirmPopup && (
            <ConfirmMint
                paymentType={selectedPaymentType}
                cost={selectedPaymentType === 'SOL' ? '0.05' : '5,000'}
                usdValue={calculateUsdValue(selectedPaymentType === 'SOL' ? 0.05 : 5000, selectedPaymentType === 'SOL' ? solPrice : labsPrice)}
                onConfirm={handleConfirm}
                onCancel={handleCancel}
                isLoading={isLoading}
                isSuccess={isSuccess}
            />
        )}
      </div>
  );
}

export default InitializeMint;
