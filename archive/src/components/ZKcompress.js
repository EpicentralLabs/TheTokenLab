import React, { useState, useEffect } from 'react';
import './ZKCompress.css';
import ErrorMessageZK from './Error-message-ZK.js';
import SuccessMessage from './InitalizingMint-message.js'

function Compress({ 
    tokenName, 
    tokenSymbol, 
    quantity, 
    decimals, 
    setIsTokenNameError, 
    setIsTokenSymbolError, 
    setIsQuantityError, 
    setIsDecimalsError
  }) {
    const [showError, setShowError] = useState(false)
    const [showSuccess, setShowSuccess] = useState(false)

useEffect(() => {
    //functionality data / algorithm to compress
  })
    
    const handleZKCompress = (paymentType) => {
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
            setShowSuccess(true)
      }
    }

    return (
        <div className='ZKcenter'>
          <div className='ZK-button-box'>
            <h1 className="compress-button-container">
                <button className="compress-button" onClick={() => handleZKCompress(/*compress var*/) }>Use ZK Compression</button>
            </h1>
          </div>
            {showError && <ErrorMessageZK />}
            {showSuccess && <SuccessMessage />}
        </div>
    );
}

export default Compress;