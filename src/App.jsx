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
import MintSuccessMessage from './components/MintSuccessMessage';
import 'dotenv/config';


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
  const [imageURI, setImageURI] = useState(''); // To store the image URI
  const [imageFile, setImageFile] = useState(null); // To store the uploaded image file

  const [userPublicKey, setUserPublicKey] = useState('');
  const [onFileUpload, setOnFileUpload] = useState('');
  const [mintSuccess, setMintSuccess] = useState(null);
  // Apply hover effect on component mount
  useEffect(() => {
    return hoverEffect()
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

  let APP_ENV = process.env.REACT_APP_ENV || 'development';
  const network = APP_ENV === 'production' ? 'mainnet-beta' : 'devnet';

  // Function to handle wallet connection
  const handleWalletConnect = (publicKey) => {
    setUserPublicKey(publicKey)
    console.log('User public key:', publicKey)
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
    if (!userPublicKey) {
      alert('Please connect your wallet first');
      return;
    }
    console.log(`Initializing mint with ${paymentType} payment`);

    const imagePath = imageFile;
    if (!validateInputs()) {
      return;
    }

    // Create FormData for the API request
    const mintData = new FormData();
    mintData.append('tokenName', tokenName);
    mintData.append('tokenSymbol', tokenSymbol);
    mintData.append('userPublicKey', userPublicKey);
    mintData.append('quantity', quantity);
    mintData.append('freezeChecked', freezeChecked);
    mintData.append('mintChecked', mintChecked);
    mintData.append('immutableChecked', immutableChecked);
    mintData.append('decimals', decimals);
    mintData.append('paymentType', paymentType);
    mintData.append('imagePath', imagePath);

    console.log('Mint data being sent:', {
      tokenName,
      tokenSymbol,
      userPublicKey,
      quantity,
      freezeChecked,
      mintChecked,
      immutableChecked,
      decimals,
      paymentType,
      imagePath,
    });

    try {
      const response = await fetch(`http://${process.env.REACT_APP_PUBLIC_URL}:${process.env.REACT_APP_BACKEND_PORT}/api/mint`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tokenName: tokenName,
          tokenSymbol: tokenSymbol,
          userPublicKey: userPublicKey,
          quantity: quantity,
          freezeChecked: freezeChecked,
          mintChecked: mintChecked,
          immutableChecked: immutableChecked,
          decimals: decimals,
          imagePath: imagePath,
          paymentType: paymentType,
        }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Minting failed');
      }

      const data = await response.json();

      console.log('Mint successful!', data);
      const { mintAddress, tokenAccount, metadataUploadOutput } = data;
      const transactionLink = data.explorerLink;
      const totalCharged = data.totalCharged;
      setMintSuccess({
        mintAddress: data.mintAddress,
        tokenAccount: data.tokenAccount,
        quantity,
        decimals,
        metadataUploadOutput: data.metadataUploadOutput,
        freezeChecked,
        totalCharged: data.totalCharged,
        paymentType,
        transactionLink: data.explorerLink,
      });

    } catch (error) {
      console.error(`${paymentType} minting failed:`, error);
      alert(`Minting failed: ${error.message}`);
    }
  };
  function setInputErrors(errors) {
    setIsTokenNameError(errors.tokenName);
    setIsTokenSymbolError(errors.tokenSymbol);
    setIsQuantityError(errors.quantity);
    setIsDecimalsError(errors.decimals);
  }

  const validateInputs = () => {
    let errors = {
      tokenName: !tokenName,
      tokenSymbol: !tokenSymbol,
      quantity: !quantity,
      decimals: !decimals,
    };

    setInputErrors(errors);

    if (Object.values(errors).includes(true)) {
      alert('All fields are required.');
      return false;
    }
    return true;
  };


  const handleSolMint = () => {
    console.log('Current imageFile state:', imageFile);
    mintTokens('SOL').catch(err => console.error('Error during SOL minting:', err));
  };

  const handleLabsMint = () => {
    console.log('Current imageFile state:', imageFile);
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
                    onFileUpload={(file) => {
                      console.log('File uploaded:', file);
                      setImageFile(file); // Update state with uploaded file path
                    }}
                    onImageURIChange={handleImageURIChange}
                    pathToFileURL={imageFile} // Use the stored image file path
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
        {/* Render mint success message */}
        {mintSuccess && (
            <div className="mint-success-message">
              <p>{mintSuccess}</p>
            </div>
        )}
      </div>
      <Footer />
    </div>
  )
}

export default App