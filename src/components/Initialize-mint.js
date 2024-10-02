import React, { useState, useEffect } from 'react'
import './Initialize-mint.css'
import ErrorMessage from './Error-message'
import SuccessMessage from './InitalizingMint-message'
import ConfirmMint from './Confirm-mint'

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
  isCompressed
}) {
  // State to store the prices of SOL and LABS tokens
  const [solPrice, setSolPrice] = useState(null)
  const [labsPrice, setLabsPrice] = useState(null)
  let solDisplayPrice = 0.05
  let labsDisplayPrice = 5000

  if(isCompressed){
    solDisplayPrice = 0.01
    labsDisplayPrice = 500
  }

  useEffect(() => {
    const fetchPrices = async () => {
      // API request options
      const options = {
        method: 'GET',
        headers: { 'X-API-KEY': `4d9a32c538a44ddd8fb7ad6d14aadec5` } // This is fine. Private repo and a free key.
      }

      try {
        // Fetch SOL price from Birdeye API
        const solResponse = await fetch('https://public-api.birdeye.so/defi/price?address=So11111111111111111111111111111111111111112', options)
        const solData = await solResponse.json()
        setSolPrice(solData.data.value)

        // Fetch LABS price from Birdeye API
        const labsResponse = await fetch('https://public-api.birdeye.so/defi/price?address=LABSh5DTebUcUbEoLzXKCiXFJLecDFiDWiBGUU1GpxR', options)
        const labsData = await labsResponse.json()
        setLabsPrice(labsData.data.value)
      } catch (err) {
        console.error('Error fetching prices:', err)
      }
    }

    // Call the fetchPrices function when the component mounts
    fetchPrices().then(r => console.log('Prices fetched successfully'))
  }, []) // Empty dependency array ensures this effect runs only once on mount

  // Helper function to calculate USD value
  const calculateUsdValue = (quantity, price) => {
    if (price) {
      return (quantity * price).toFixed(2) // Return USD value with 2 decimal places
    }
    return '...' // Return placeholder if price is not available
  }

  const [showError, setShowError] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [showConfirmPopup, setShowConfirmPopup] = useState(false)
  const [selectedPaymentType, setSelectedPaymentType] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  const handleInitializeMint = (paymentType) => {
    let hasError = false;

    if (!tokenName.trim()) {
      setIsTokenNameError(true)
      hasError = true
    }
    if (!tokenSymbol.trim()) {
      setIsTokenSymbolError(true)
      hasError = true
    }
    if (!quantity.trim()) {
      setIsQuantityError(true)
      hasError = true
    }
    if (!decimals.trim()) {
      setIsDecimalsError(true)
      hasError = true
    }

    if (hasError) {
      setShowError(true)
      setShowSuccess(false)
    } else {
      setShowError(false)
      setSelectedPaymentType(paymentType)
      setShowConfirmPopup(true)
    }
  }

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
    setShowConfirmPopup(false)
    setIsSuccess(false)
    setIsLoading(false)
  }

  // Reset error and success states when inputs change
  useEffect(() => {
    setIsTokenNameError(false)
    setIsTokenSymbolError(false)
    setIsQuantityError(false)
    setIsDecimalsError(false)
    setShowError(false)
    setShowSuccess(false)
  }, [tokenName, tokenSymbol, quantity, decimals])

  return (
    <div className="initialize-mint">
      <h2 className="initialize-mint-title">Initialize Mint:</h2>
      <div className="initialize-mint-button-container">
        {/* SOL payment option */}
        <button className="initialize-mint-button" onClick={() => handleInitializeMint('SOL')}>
          {solDisplayPrice} SOL
          <span className="initialize-mint-subtext">(≈ ${calculateUsdValue(solDisplayPrice, solPrice)})</span>
        </button>
        <span className="initialize-mint-or-text">or</span>
        {/* LABS payment option */}
        <button className="initialize-mint-button" onClick={() => handleInitializeMint('LABS')}>
          <span>{labsDisplayPrice} LABS</span>
          <span className="initialize-mint-subtext">(≈ ${calculateUsdValue(labsDisplayPrice, labsPrice)})</span>
        </button>
      </div>
      {showError && <ErrorMessage />}
      {showSuccess && <SuccessMessage />}
      {showConfirmPopup && (
        <ConfirmMint
          paymentType={selectedPaymentType}
          cost={selectedPaymentType === 'SOL' ? solDisplayPrice : labsDisplayPrice}
          usdValue={calculateUsdValue(selectedPaymentType === 'SOL' ? solDisplayPrice : labsDisplayPrice, selectedPaymentType === 'SOL' ? solPrice : labsPrice)}
          onConfirm={handleConfirm}
          onCancel={handleCancel}
          isLoading={isLoading}
          isSuccess={isSuccess}
        />
      )}
    </div>
  )
}

export default InitializeMint