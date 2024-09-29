import React from 'react'
import './InitalizingMint-message.css'

function InitalizingMintMessage() {
  return (
    <div className="initializing-mint-message fade-in">
      <h3 className="initializing-mint-title">Initializing Mint...</h3>
      <p className="initializing-mint-subtitle">Please be sure to confirm wallet signatures.</p>
    </div>
  )
}

export default InitalizingMintMessage