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
import ImmutableSwitch from './components/Immutable-switch'
import WarningMessage from './components/Warning-message'
import ZKWarningMessage from './components/ZKWarningMessage'
import InitializeMint from './components/Initialize-mint'
import Footer from './components/Footer'
import MintSuccessMessage from './components/MintSuccessMessage';
import Compress from './components/ZKcompress';

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
  const [isMinting, setIsMinting] = useState(false);
  const [mintSuccess, setMintSuccess] = useState(null);
  // Apply hover effect on component mount
  useEffect(() => {
    return hoverEffect()
  }, [])

  // State variables for switch components and warning message
  // State for mint authority switch
  const [mintChecked, setMintChecked] = useState(false)
  // State for immutable switch
  const [immutableChecked, setImmutableChecked] = useState(false)
  // State to control the visibility of the warning message
  const [showWarning, setShowWarning] = useState(false)
  // Add new state for ZK compression
  const [zkChecked, setZKChecked] = useState(false)

  // let APP_ENV = process.env.REACT_APP_ENV || 'development';
  // const network = APP_ENV === 'production' ? 'mainnet-beta' : 'devnet';

  // Function to handle wallet connection
  const handleWalletConnect = (publicKey) => {
    setUserPublicKey(publicKey)
    console.log('User public key:', publicKey)
  }

  // Show warning message when any switch is checked
  useEffect(() => {
    const warningState = mintChecked || immutableChecked
    if (warningState) {
      // Small delay to ensure the component is mounted before fading in
      const timer = setTimeout(() => setShowWarning(true), 50)
      return () => clearTimeout(timer)
    } else {
      setShowWarning(false)
    }
  }, [mintChecked, immutableChecked])


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

  const compressTokens = async (paymentType) => {
    if (!userPublicKey) {
      alert('Please connect your wallet first');
      return;
    }
    console.log(`ZK Compress Button is ${zkChecked}`);

    const sanitizedQuantity = parseFloat(quantity.replace(/,/g, ''));


    const compressData = new FormData();
  
    compressData.append('userPublicKey', userPublicKey);
    compressData.append('quantity', sanitizedQuantity);
    compressData.append('mintChecked', mintChecked);
    compressData.append('immutableChecked', immutableChecked);
    compressData.append('decimals', decimals);
    compressData.append('paymentType', paymentType);
    compressData.append('zkChecked', zkChecked);

    console.log('Compress Token data being sent:', {
   
      userPublicKey,
      quantity: sanitizedQuantity,
      mintChecked,
      immutableChecked,
      decimals,
      paymentType,
      zkChecked,
    });


    try {
      const url = process.env.REACT_APP_APP_ENV === 'development'
          ? `${process.env.REACT_APP_PUBLIC_URL}:${process.env.REACT_APP_BACKEND_PORT}/api/compress-mint`
          : `${process.env.REACT_APP_PUBLIC_URL}/api/compress-mint`;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userPublicKey: userPublicKey,
          quantity: sanitizedQuantity,
          mintChecked: mintChecked,
          immutableChecked: immutableChecked,
          decimals: decimals,
          paymentType: paymentType,
          zkChecked: zkChecked,
        }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Minting failed');
      }

      const data = await response.json();

      console.log('Mint successful!', data);
      const { mintAddress, tokenAccount, totalCharged } = data;
      console.log('mintAddress:', mintAddress);
      console.log('tokenAccount:', tokenAccount);
      const transactionLink = data.explorerLink;
      console.log('transactionLink:', transactionLink);
      console.log(onFileUpload, 'onFileUpload', setOnFileUpload());
      console.log(imageFile, 'imageFile', setImageFile());
      
      setMintSuccess({
        mintAddress,
        tokenAccount,
        quantity,
        decimals,
        totalCharged,
        paymentType,
        transactionLink,
      });
      console.log ('totalCharged:', data.totalCharged);
    } catch (error) {
      console.error(`${paymentType} minting failed:`, error);
      alert(`Minting failed: ${error.message}`);
    }
  };


  const mintTokens = async (paymentType) => {
    if (!userPublicKey) {
      alert('Please connect your wallet first');
      return;
    }
    setIsMinting(true);
    console.log(`Initializing mint with ${paymentType} payment`);

    const imagePath = imageFile;
    if (!validateInputs()) {
      return;
    }

    const sanitizedQuantity = parseFloat(quantity.replace(/,/g, ''));


    const mintData = new FormData();
    mintData.append('tokenName', tokenName);
    mintData.append('tokenSymbol', tokenSymbol);
    mintData.append('userPublicKey', userPublicKey);
    mintData.append('quantity', sanitizedQuantity);
    mintData.append('mintChecked', mintChecked);
    mintData.append('immutableChecked', immutableChecked);
    mintData.append('decimals', decimals);
    mintData.append('paymentType', paymentType);
    mintData.append('imagePath', imagePath);

    console.log('Mint data being sent:', {
      tokenName,
      tokenSymbol,
      userPublicKey,
      quantity: sanitizedQuantity,
      mintChecked,
      immutableChecked,
      decimals,
      paymentType,
      imagePath,
    });


    try {
      const url = process.env.REACT_APP_APP_ENV === 'development'
          ? `${process.env.REACT_APP_PUBLIC_URL}:${process.env.REACT_APP_BACKEND_PORT}/api/mint`
          : `${process.env.REACT_APP_PUBLIC_URL}/api/mint`;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tokenName: tokenName,
          tokenSymbol: tokenSymbol,
          userPublicKey: userPublicKey,
          quantity: sanitizedQuantity,
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
      
      // Set mintSuccess data
      setMintSuccess({
        mintAddress: data.mintAddress,
        tokenAccount: data.tokenAccount,
        quantity,
        decimals,
        metadataUploadOutput: data.metadataUploadOutput,
        totalCharged: data.totalCharged,
        paymentType,
        transactionLink: data.explorerLink,
      });
    } catch (error) {
      console.error(`${paymentType} minting failed:`, error);
      alert(`Minting failed: ${error.message}`);
    } finally {
      setIsMinting(false);
    }
  };
  function setInputErrors(errors) {
    setIsTokenNameError(errors.tokenName);
    setIsTokenSymbolError(errors.tokenSymbol);
    setIsQuantityError(errors.quantity);
    setIsDecimalsError(errors.decimals);
  }



  const handleSolMint = () => {
    return mintTokens('SOL');
  };

  const handleLabsMint = () => {
    return mintTokens('LABS');
  };

  const handleImageURIChange = (uri) => {
    setImageURI(uri)
    console.log('Image URI updated:', uri)
  }

  const handleCloseMintSuccess = () => {
    setMintSuccess(null);
  };

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
              {/* Add ZKcompress component here */}
              <Compress 
              isChecked={zkChecked}
              setIsChecked={setZKChecked}
              />
              <div className="zk-warning-box">
              {(zkChecked) && (<ZKWarningMessage className={showWarning ? 'fade-in' : ''} />)}
              </div>

            </div>
          </section>
          
          {/* Authority revocation section */}
          <div className="revoke">
            Revoke (Remove):
          </div>
          
          {/* Token authority switches */}
          <div className="switch-grid">
            <MintSwitch isChecked={mintChecked} setIsChecked={setMintChecked} />
            <ImmutableSwitch isChecked={immutableChecked} setIsChecked={setImmutableChecked} />
          </div>
          
          {/* Conditional rendering of warning message */}
          {(mintChecked || immutableChecked) && (
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
            zkChecked={zkChecked} // Pass zkChecked to InitializeMint
          />
        </header>
        {isMinting && <div className="minting-overlay">Minting in progress...</div>}
        {mintSuccess && (
          <MintSuccessMessage
            mintAddress={mintSuccess.mintAddress}
            tokenAccount={mintSuccess.tokenAccount}
            quantity={mintSuccess.quantity}
            decimals={mintSuccess.decimals}
            metadataUploadOutput={mintSuccess.metadataUploadOutput}
            totalCharged={mintSuccess.totalCharged}
            paymentType={mintSuccess.paymentType}
            transactionLink={mintSuccess.transactionLink}
            onClose={handleCloseMintSuccess}
          />
        )}
      </div>
      <Footer />
    </div>
  )
}

export default App