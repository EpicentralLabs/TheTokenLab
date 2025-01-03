import React, { useState, useEffect } from "react";
import "./Connect-wallet.css";

function ConnectWallet({ onWalletConnect }) {
    // State variables for wallet connection and UI control
    const [connected, setConnected] = useState(false);          // Tracks if wallet is connected
    const [isConnecting, setIsConnecting] = useState(false);    // Indicates if connection is in progress
    const [showWalletOptions, setShowWalletOptions] = useState(false);  // Controls display of wallet options
    const [showDisconnectOption, setShowDisconnectOption] = useState(false);  // Controls display of disconnect option
    const [wallet, setWallet] = useState(null);                 // Stores the wallet instance
    const [walletAddress, setWalletAddress] = useState("");     // Stores the connected wallet's address

    // Effect hook to initialize wallet on component mount
    useEffect(() => {
        const initWallet = async () => {
            if (window.solana && window.solana.isPhantom) {
                const solana = window.solana;
                // Disable auto-connect for better user control
                solana.autoConnect = false;
                setWallet(solana);
            }
        };
        initWallet().then(r => console.log("Wallet initialized successfully"));
    }, []);

    // Function to handle wallet disconnection
    const handleDisconnect = () => {
        if (wallet) {
            wallet.disconnect();
            setConnected(false);
            setWalletAddress("");
            setShowDisconnectOption(false);
        }
    };

    // Function to handle the main button click
    const handleConnectClick = () => {
        if (!connected) {
            setShowWalletOptions(true);
        } else {
            setShowDisconnectOption(!showDisconnectOption);
        }
    };

    // Function to connect to Phantom wallet
    const handleConnectPhantom = async () => {
        if (!wallet) return;
        setIsConnecting(true);
        try {
            const { publicKey } = await wallet.connect({ onlyIfTrusted: false });
            setConnected(true);
            const address = publicKey.toString();
            setWalletAddress(address);
            onWalletConnect(address); // Pass the address to the parent component
        } catch (error) {
            console.error("Failed to connect wallet:", error);
        } finally {
            setIsConnecting(false);
            setShowWalletOptions(false);
        }
    };

    // Helper function to shorten wallet address for display
    const shortenAddress = (address) => {
        return `${address.slice(0, 4)}...${address.slice(-4)}`;
    };

    return (
        <div className="ConnectWalletContainer">
            <div className="dropdown-container">
                <button 
                    className="CWButton"
                    onClick={handleConnectClick}
                    disabled={isConnecting}
                >
                    {connected ? shortenAddress(walletAddress) : isConnecting ? "Connecting..." : "Connect Wallet"}
                </button>
                {/* Dropdown for wallet options when not connected */}
                {showWalletOptions && !connected && (
                    <div className="wallet-options-dropdown">
                        <button onClick={handleConnectPhantom} className="wallet-option">
                            <img src="/PhantomWallet_ICON_Transparent.png" alt="Phantom Wallet" className="wallet-icon" />
                            <span>Phantom Wallet</span>
                        </button>
                        {/* Additional wallet options can be added here */}
                        <button onClick={() => setShowWalletOptions(false)} className="wallet-option">Cancel</button>
                    </div>
                )}
                {/* Dropdown for disconnect option when connected */}
                {showDisconnectOption && connected && (
                    <div className="wallet-options-dropdown">
                        <button onClick={handleDisconnect} className="wallet-option">Disconnect</button>
                        <button onClick={() => setShowDisconnectOption(false)} className="wallet-option">Cancel</button>
                    </div>
                )}
            </div>
        </div>
    );
}

export default ConnectWallet;