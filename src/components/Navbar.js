import React, { useState } from 'react';
import './Navbar.css';
import ConnectWallet from './Connect-wallet';

function Navbar({ walletAddress, setWalletAddress }) {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const toggleMenu = () => {
        setIsMenuOpen(!isMenuOpen);
    };

    return (
        <nav className="navbar">
            <div className="navbar-container">
                <a href="/" className="navbar-logo">
                    <img src="/NavbarLogo.png" alt="The Token Lab Logo" />
                </a>
                <div className={`navbar-menu ${isMenuOpen ? 'active' : ''}`} style={{display: 'flex'}}>
                    <a href="/" className="navbar-item glow-effect">Home</a>
                    <a href="/docs" className="navbar-item glow-effect">Docs</a>
                    <a href="/dao" className="navbar-item glow-effect">DAO</a>
                </div>
            </div>
            <div className="navbar-right">
                <div className="menu-icon" onClick={toggleMenu}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path className={`line ${isMenuOpen ? 'open' : ''}`} d="M3 6H21" stroke="#00FFA3" strokeWidth="2" strokeLinecap="round"/>
                        <path className={`line ${isMenuOpen ? 'open' : ''}`} d="M3 12H21" stroke="#00FFA3" strokeWidth="2" strokeLinecap="round"/>
                        <path className={`line ${isMenuOpen ? 'open' : ''}`} d="M3 18H21" stroke="#00FFA3" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                </div>
                <div className="connect-wallet-container">
                    <ConnectWallet walletAddress={walletAddress} setWalletAddress={setWalletAddress} />
                </div>
            </div>
        </nav>
    );
}

export default Navbar;