import React, {useEffect, useState} from 'react'
import './App.css'
import BrandHeader from './components/Brand-header'
import SubHeader from './components/Sub-header'
import TokenLabTitle from './components/TokenLab-header'
import Navbar from './components/Navbar'
import SloganHeader from './components/Slogan-header'
import {hoverEffect} from './effects-js/hoverEffect'
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
import logger from "../backend/logger";
import {clusterApiUrl, Connection} from "@solana/web3.js";

function App() {
  // State for token details
  const [tokenName, setTokenName] = useState('') // Stores the name of the token
  const [tokenSymbol, setTokenSymbol] = useState('') // Stores the symbol of the token
  const [quantity, setQuantity] = useState('') // Stores the quantity of tokens to mint
  const [decimals, setDecimals] = useState('') // Stores the number of decimal places for the token

  // State for input validation errors
  const [isTokenNameError, setIsTokenNameError] = useState(false) // Tracks if there's an error in the token name input
  const [isTokenSymbolError, setIsTokenSymbolError] = useState(false) // Tracks if there's an error in the token symbol input
  const [isQuantityError, setIsQuantityError] = useState(false) // Tracks if there's an error in the quantity input
  const [isDecimalsError, setIsDecimalsError] = useState(false) // Tracks if there's an error in the decimals input

  // New state variable for image URI (hopefully this is what you meant was needed)
  const [imageURI, setImageURI] = useState('')

  // New state variable for userPublicKey
  const [userPublicKey, setUserPublicKey] = useState('')

  // Apply hover effect on component mount
  useEffect(() => {
    const cleanup = hoverEffect()
    return cleanup
  }, [])

  // State variables for switch components and warning message
  // State for mint authority switch
  const [mintChecked, setMintChecked] = useState(false)
  // State for freeze authority switch
  const [freezeChecked, setFreezeChecked] = useState(false)
  // State for immutable switch
  const [immutableChecked, setImmutableChecked] = useState(false)
  // State to control the visibility of the warning message
  const [showWarning, setShowWarning] = useState(false)

  const { PUBLIC_URL, REACT_APP_BACKEND_PORT, APP_ENV } = process.env;
  const backendUrl = `${PUBLIC_URL}:${REACT_APP_BACKEND_PORT}`;

// Set the network based on the environment
  const network = APP_ENV === 'production' ? 'mainnet-beta' : 'devnet';

// Create a connection to the Solana cluster
  const connection = new Connection(clusterApiUrl(network), 'confirmed');

// Store the expected URL for the cluster
  const expectedUrl = clusterApiUrl(network);
  // Function to handle wallet connection
  const handleWalletConnect = (publicKey) => {
    setUserPublicKey(publicKey)
    logger.info('User public key:', publicKey)
  }

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




  const mintTokens = async (paymentType) => {
    logger.info(`Initializing mint with ${paymentType} payment`);
    try {
      const mintData = {
        tokenName,
        tokenSymbol,
        userPublicKey,
        quantity,
        imageURI,
        freezeChecked,
        mintChecked,
        immutableChecked,
        decimals,
        paymentType,
      };

      const response = await fetch(`http://${process.env.PUBLIC_URL}:${process.env.BACKEND_PORT}/api/mint`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(mintData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Minting failed');
      }

      logger.info('Mint successful!', result);
      alert(`Mint successful! Mint Address: ${result.mintAddress}\nToken Account: ${result.tokenAccount}\n${result.metadataUploadOutput}`);

    } catch (error) {
      logger.error(`${paymentType} minting failed: ${error.message}`);
      alert(`Minting failed: ${error.message}`);
    }
  };

  const handleSolMint = () => {
    mintTokens('SOL').catch(err => console.error('Error during SOL minting:', err));
  };

  const handleLabsMint = () => {
    mintTokens('LABS').catch(err => console.error('Error during LABS minting:', err));
  };

  // Function to handle changes in the image URI (IF any changes occur or are needed)
  const handleImageURIChange = (uri) => {
    // Update the imageURI state with the new URI
    setImageURI(uri)
    // Log the updated URI to the console for debugging
    console.log('Image URI updated:', uri)
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
        {/* Navbar component with wallet connection functionality */}
        <Navbar onWalletConnect={handleWalletConnect} />
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
              <h1>
                {/* PhotoInput component for uploading and handling image files */}
                <PhotoInput 
                  // Callback function when a file is uploaded
                  onFileUpload={(file) => logger.info('File uploaded:', file)} 
                  // Callback function to handle changes in the image URI
                  onImageURIChange={handleImageURIChange}
                />
              </h1>
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
            imageURI={imageURI}  // Pass the imageURI to InitializeMint
            userPublicKey={userPublicKey} // Pass the userPublicKey to InitializeMint
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