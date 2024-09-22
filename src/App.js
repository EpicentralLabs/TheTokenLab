import React, { useState, useEffect } from 'react'
import './App.css'
import BrandHeader from './components/Brand-header'
import SubHeader from './components/Sub-header'
import TokenLabTitle from './components/TokenLab-header'
import Navbar from './components/Navbar'
import SloganHeader from './components/Slogan-header'
import { hoverEffect } from './effects-js/hoverEffect'
import TokenNameList from './components/Name-input'
import TokenSymbolList from './components/Symbol-input'
import QuantityInput from './components/Quantity-input'
import DecimalsInput from './components/Decimals-input'
import DescriptionInput from './components/Description-input'
import PhotoInput from './components/Photo-input'
import MintSwitch from './components/Mint-switch'
import FreezeSwitch from './components/Freeze-switch'
import ImmutableSwitch from './components/Immutable-switch'
import WarningMessage from './components/Warning-message'
import InitializeMint from './components/Initialize-mint'
import Footer from './components/Footer'

function App() {
  const [tokenName, setTokenName] = useState('')
  const [tokenSymbol, setTokenSymbol] = useState('')
  const [quantity, setQuantity] = useState('')
  const [decimals, setDecimals] = useState('')
  const [isTokenNameError, setIsTokenNameError] = useState(false)
  const [isTokenSymbolError, setIsTokenSymbolError] = useState(false)
  const [isQuantityError, setIsQuantityError] = useState(false)
  const [isDecimalsError, setIsDecimalsError] = useState(false)

  // Apply hover effect on component mount
  useEffect(() => {
    const cleanup = hoverEffect()
    return cleanup
  }, [])

  // State variables for switch components and warning message
  const [mintChecked, setMintChecked] = useState(false)
  const [freezeChecked, setFreezeChecked] = useState(false)
  const [immutableChecked, setImmutableChecked] = useState(false)
  const [showWarning, setShowWarning] = useState(false)

  // Show warning message when any switch is checked
  useEffect(() => {
    const warningState = mintChecked || freezeChecked || immutableChecked
    if (warningState) {
      // Small delay to ensure the component is mounted before fading in
      const timer = setTimeout(() => setShowWarning(true), 50)
      return () => clearTimeout(timer)
    } else {
      setShowWarning(false)
    }
  }, [mintChecked, freezeChecked, immutableChecked])

  const handleSolMint = () => {
    console.log('Initializing mint with SOL payment')
    // Add your SOL minting logic here
  }

  const handleLabsMint = () => {
    console.log('Initializing mint with LABS payment')
    // Add your LABS minting logic here
  }

  return (
    <div className="App" style={{
      backgroundImage: `url(${process.env.PUBLIC_URL}/TheTokenLab-App_BG-Transparent.svg)`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
      backgroundAttachment: 'fixed',
      minHeight: '100vh'
    }}>
      <div className="Header-container">            
        {/* Navigation bar component now includes ConnectWallet */}
        <Navbar />
        <header className="App-header">
          {/* Brand and slogan sections */}
          <section className="Brand-header">
            <h1><BrandHeader /></h1>
          </section>
          <section className="Sub-header">
            <h2><SubHeader /></h2>
          </section>
          <section className="TokenLab-header">
            <h1><TokenLabTitle /></h1>
          </section>
          <section className="Slogan-header">
            <h3><SloganHeader /></h3>
          </section>
          <hr className="top-bar" /> 
        
          {/* Input sections */}
          <section className="Input-grid-left-and-right">
            <div className="Input-List">
              {/* Token details inputs */}
              <h1 className="listSpacing">
                <TokenNameList 
                  tokenName={tokenName} 
                  setTokenName={setTokenName} 
                  isError={isTokenNameError}
                />
              </h1>
              <h1 className="listSpacing">
                <TokenSymbolList 
                  tokenSymbol={tokenSymbol} 
                  setTokenSymbol={setTokenSymbol} 
                  isError={isTokenSymbolError}
                />
              </h1>
              <h1 className="listSpacing">
                <QuantityInput 
                  quantity={quantity} 
                  setQuantity={setQuantity} 
                  isError={isQuantityError}
                />
              </h1>
              <h1 className="listSpacing">
                <DecimalsInput 
                  decimals={decimals} 
                  setDecimals={setDecimals} 
                  isError={isDecimalsError}
                />
              </h1>
              <h1 className="listSpacing"><DescriptionInput /></h1>
            </div>
            <div className="Input-List">
              {/* Photo upload input */}
              <h1><PhotoInput /></h1>
            </div>
          </section>
          
          {/* Authority revocation section */}
          <div className="revoke">
            Revoke Authority:
          </div>
          
          {/* Token authority switches */}
          <div className="switch-grid">
            <h1><MintSwitch isChecked={mintChecked} setIsChecked={setMintChecked} /></h1>
            <h1><FreezeSwitch isChecked={freezeChecked} setIsChecked={setFreezeChecked} /></h1>
            <h1><ImmutableSwitch isChecked={immutableChecked} setIsChecked={setImmutableChecked} /></h1>
          </div>
          
          {/* Conditional rendering of warning message */}
          {(mintChecked || freezeChecked || immutableChecked) && (
            <WarningMessage className={showWarning ? 'fade-in' : ''} />
          )}
          
          {/* Update InitializeMint component */}
          <InitializeMint 
            tokenName={tokenName}
            tokenSymbol={tokenSymbol}
            quantity={quantity}
            decimals={decimals}
            setIsTokenNameError={setIsTokenNameError}
            setIsTokenSymbolError={setIsTokenSymbolError}
            setIsQuantityError={setIsQuantityError}
            setIsDecimalsError={setIsDecimalsError}
            onSolMintClick={handleSolMint}
            onLabsMintClick={handleLabsMint}
          />
          
        </header>
      </div>
      <Footer />
    </div>
  )
}

export default App