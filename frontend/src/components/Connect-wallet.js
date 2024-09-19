import React, { useState, useEffect } from "react";
import "./Connect-wallet.css";
// Remove this line: import phantomIcon from "../assets/PhantomWallet_ICON_Transparent.png";

function ConnectWallet() {
    // State variables for wallet connection and UI control
    const [wallet, setWallet] = useState(null);
    const [connected, setConnected] = useState(false);
    const [isConnecting, setIsConnecting] = useState(false);
    const [walletAddress, setWalletAddress] = useState("");
    const [showWalletOptions, setShowWalletOptions] = useState(false);
    const [showDisconnectOption, setShowDisconnectOption] = useState(false);

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
        initWallet();
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
            setWalletAddress(publicKey.toString());
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