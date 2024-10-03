import React, { useState, useEffect } from 'react';
import './Initialize-mint.css';
import ErrorMessage from './ErrorMessage';
import SuccessMessage from './InitalizingMintMessage';
import ConfirmMint from './ConfirmMint';
import {Connection, Transaction, SystemProgram, Keypair, clusterApiUrl, PublicKey} from '@solana/web3.js';
import bs58 from 'bs58';

interface InitializeMintProps {
  tokenName: string;
  tokenSymbol: string;
  quantity: number;
  decimals: number;
  userPublicKey: PublicKey | null;
  payerPublicKey: PublicKey | null;
  setIsTokenNameError: (val: boolean) => void;
  setIsTokenSymbolError: (val: boolean) => void;
  setIsQuantityError: (val: boolean) => void;
  setIsDecimalsError: (val: boolean) => void;
  onSolMintClick: () => void;
  onLabsMintClick: () => void;
}

const InitializeMint: React.FC<InitializeMintProps> = ({
                                                         tokenName,
                                                         tokenSymbol,
                                                         quantity,
                                                         decimals,
                                                         setIsTokenNameError,
                                                         setIsTokenSymbolError,
                                                         setIsQuantityError,
                                                         setIsDecimalsError,
                                                         onSolMintClick,
                                                         onLabsMintClick
                                                       }) => {
  const [solPrice, setSolPrice] = useState<number | null>(null);
  const [labsPrice, setLabsPrice] = useState<number | null>(null);
  const [showError, setShowError] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showConfirmPopup, setShowConfirmPopup] = useState(false);
  const [selectedPaymentType, setSelectedPaymentType] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [dappEncryptionPublicKey, setDappEncryptionPublicKey] = useState<string | null>(null);
  const [session, setSession] = useState<string | null>(null);
  const [nonce, setNonce] = useState<string | null>(null);

  useEffect(() => {
    const fetchPrices = async () => {
      const options = {
        method: 'GET',
        headers: { 'X-API-KEY': '4d9a32c538a44ddd8fb7ad6d14aadec5' }
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

    fetchPrices().then(() => console.log('Prices fetched successfully'));
  }, []);

  const calculateUsdValue = (quantity: number, price: number | null): string => {
    if (price) {
      return (quantity * price).toFixed(2);
    }
    return '...';
  };

  const handleInitializeMint = (paymentType: string) => {
    let hasError = false;

    if (!tokenName.trim()) {
      setIsTokenNameError(true);
      hasError = true;
    }
    if (!tokenSymbol.trim()) {
      setIsTokenSymbolError(true);
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

  const getLamports = (paymentType: string, quantity: string): number => {
    if (paymentType === 'SOL') {
      const solValueInUSD = solPrice; // Use the fetched SOL price in USD
      const usdValue = calculateUsdValue(Number(quantity), solValueInUSD); // Convert quantity to USD
      return Math.round((parseFloat(usdValue) / (solValueInUSD || 1)) * 1e9); // Convert USD to lamports
    } else if (paymentType === 'LABS') {
      const labsValueInUSD = labsPrice; // Use the fetched LABS price in USD
      const usdValue = calculateUsdValue(Number(quantity), labsValueInUSD); // Convert quantity to USD
      return Math.round((parseFloat(usdValue) / (labsValueInUSD || 1)) * 5000); // Convert USD to LABS lamports
    }
    return 0; // Default case if paymentType is unknown
  };

  const handleConfirm = async () => {
    setIsLoading(true)
    try {
      if (selectedPaymentType === 'SOL') {
        await onSolMintClick()
      } else if (selectedPaymentType === 'LABS') {
        await onLabsMintClick()
      }
      setIsSuccess(true)
    } catch (error) {
      console.error('Minting failed:', error)
      setIsSuccess(false)
    } finally {
      setIsLoading(false)
    }
  }


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

  // @ts-ignore
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
                // @ts-ignore
                handleConfirm={handleConfirm}
                handleCancel={handleCancel}
                isLoading={isLoading}
                isSuccess={isSuccess}
            />
        )}
      </div>
  );
};

export default InitializeMint;
