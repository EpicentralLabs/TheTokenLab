// src/app/page.tsx
"use client";
import React, { useState } from "react";
import Layout from "./layout";
import TokenInputs from "./components/TokenInputs";
import InitializeMint from "./components/InitializeMint";
import MintSuccessMessage from "./components/MintSuccessMessage";
import WarningMessage from "./components/WarningMessage";
import BrandHeader from "./components/BrandHeader";
import SubHeader from "./components/SubHeader";
import TokenLabTitle from "./components/TokenLabHeader";
import SloganHeader from "./components/SloganHeader";
import MintSwitch from "./components/MintSwitch";
import ImmutableSwitch from "./components/ImmutableSwitch";
import {Keypair, PublicKey} from "@solana/web3.js";

export default function Home() {
  const [tokenName, setTokenName] = useState("");
  const [tokenSymbol, setTokenSymbol] = useState("");
  const [quantity, setQuantity] = useState(0);
  const [decimals, setDecimals] = useState(0);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageURI, setImageURI] = useState("");
  const [mintChecked, setMintChecked] = useState(false);
  const [immutableChecked, setImmutableChecked] = useState(false);
  const [mintSuccess, setMintSuccess] = useState<any>(null);
  const [userPublicKey, setUserPublicKey] = useState<PublicKey | null>(null);
  const { payer, payerPublicKey } = generatePayor();
  const [inputErrors, setInputErrors] = useState({
    tokenName: false,
    tokenSymbol: false,
    quantity: false,
    decimals: false,
  });

  const handleWalletConnect = (publicKeyString: string) => {
    const publicKey = new PublicKey(publicKeyString);
    setUserPublicKey(publicKey);
    console.log("User public key:", publicKey.toString());
  };


  function generatePayor(): { payer?: Keypair; payerPublicKey: PublicKey | null } {
    const privateKey = process.env.SOLANA_PRIVATE_KEY; // Fetch the private key from environment variables
    if (!privateKey) {
      console.error('❌ Missing SOLANA_PRIVATE_KEY environment variable');
      return { payerPublicKey: null }; // Return null if the environment variable is missing
    }

    let secretKeyArray: number[];
    try {
      secretKeyArray = JSON.parse(privateKey); // Parse the private key JSON string into an array
    } catch (error) {
      console.error('❌ Invalid SOLANA_PRIVATE_KEY environment variable');
      return { payerPublicKey: null }; // Return null if parsing fails
    }

    let payer: Keypair;
    try {
      payer = Keypair.fromSecretKey(Uint8Array.from(secretKeyArray));
    } catch (error) {
      console.error('❌ Error creating Keypair from secret key:', error);
      return { payerPublicKey: null }; // Return null if creating Keypair fails
    }

    const payerPublicKey: PublicKey = payer.publicKey; // Extract public key from Keypair
    return { payer, payerPublicKey }; // Return both Keypair and PublicKey
  }
  const validateInputs = () => {
    const errors = {
      tokenName: !tokenName,
      tokenSymbol: !tokenSymbol,
      quantity: quantity <= 0,
      decimals: decimals < 0,
    };
    setInputErrors(errors);
    return !Object.values(errors).some(Boolean);
  };

  const mintTokens = async (paymentType: string) => {
    if (!userPublicKey) {
      alert("Please connect your wallet first");
      return;
    }

    console.log(`Initializing mint with ${paymentType} payment`);

    const imagePath = imageFile;

    if (!validateInputs()) {
      return;
    }

    const sanitizedQuantity = parseFloat(quantity.toString().replace(/,/g, ""));

    const mintData = {
      tokenName,
      tokenSymbol,
      userPublicKey,
      quantity: sanitizedQuantity,
      mintChecked,
      immutableChecked,
      decimals,
      paymentType,
      imagePath,
    };

    console.log("Mint data being sent:", mintData);

    try {
      const url =
          process.env.NEXT_PUBLIC_APP_ENV === "development"
              ? `${process.env.NEXT_PUBLIC_PUBLIC_URL}:${process.env.NEXT_PUBLIC_BACKEND_PORT}/api/mint`
              : `${process.env.NEXT_PUBLIC_PUBLIC_URL}/api/mint`;

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(mintData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Minting failed");
      }

      const data = await response.json();
      console.log("Mint successful!", data);
      const { mintAddress, tokenAccount, metadataUploadOutput, totalCharged, explorerLink } = data;

      setMintSuccess({
        mintAddress,
        tokenAccount,
        quantity: sanitizedQuantity,
        decimals,
        metadataUploadOutput,
        totalCharged,
        paymentType,
        transactionLink: explorerLink,
      });
    } catch (error) {
      console.error(`${paymentType} minting failed:`, error);
      // @ts-ignore
      alert(`Minting failed: ${error.message}`);
    }
  };

  const handleSolMint = () => {
    console.log("Current imageFile state:", imageFile);
    mintTokens("SOL").catch((err) => console.error("Error during SOL minting:", err));
  };

  const handleLabsMint = () => {
    console.log("Current imageFile state:", imageFile);
    mintTokens("LABS").catch((err) => console.error("Error during LABS minting:", err));
  };

  const handleImageURIChange = (uri: string) => {
    setImageURI(uri);
    console.log("Image URI updated:", uri);
  };

  return (
      <Layout onWalletConnect={handleWalletConnect}>
        <div className="Header-container">
          <section className="Brand-header">
            <h1>
              <BrandHeader />
            </h1>
          </section>
          <section className="Sub-header">
            <h2>
              <SubHeader />
            </h2>
          </section>
          <section className="TokenLab-header">
            <h1>
              <TokenLabTitle />
            </h1>
          </section>
          <section className="Slogan-header">
            <h3>
              <SloganHeader />
            </h3>
          </section>
          <hr className="top-bar" />

          {/* Token Inputs Section */}
          <TokenInputs
              tokenName={tokenName}
              setTokenName={setTokenName}
              tokenSymbol={tokenSymbol}
              setTokenSymbol={setTokenSymbol}
              quantity={quantity}
              setQuantity={setQuantity}
              decimals={decimals}
              setDecimals={setDecimals}
              imageFile={imageFile}
              setImageFile={setImageFile}
              onImageURIChange={handleImageURIChange}
          />

          {/* Authority revocation section */}
          <div className="revoke">Revoke (Remove):</div>

          {/* Token authority switches */}
          <div className="switch-grid">
            <MintSwitch isChecked={mintChecked} setIsChecked={setMintChecked} />
            <ImmutableSwitch isChecked={immutableChecked} setIsChecked={setImmutableChecked} />
          </div>

          {/* Conditional rendering of warning message */}
          {(mintChecked || immutableChecked) && <WarningMessage />}

          {/* Initialize Mint Component */}
          <InitializeMint
              tokenName={tokenName}
              tokenSymbol={tokenSymbol}
              quantity={quantity}
              decimals={decimals}
              userPublicKey={userPublicKey}
              payerPublicKey={payerPublicKey}
              setIsTokenNameError={(val) => setInputErrors((prev) => ({ ...prev, tokenName: val }))}
              setIsTokenSymbolError={(val) => setInputErrors((prev) => ({ ...prev, tokenSymbol: val }))}
              setIsQuantityError={(val) => setInputErrors((prev) => ({ ...prev, quantity: val }))}
              setIsDecimalsError={(val) => setInputErrors((prev) => ({ ...prev, decimals: val }))}
              onSolMintClick={handleSolMint}
              onLabsMintClick={handleLabsMint}
          />

          {/* Mint Success Message */}
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
              />
          )}
        </div>
      </Layout>
  );
}
