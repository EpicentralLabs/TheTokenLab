"use client"; // Add this line at the top

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import './Navbar.css';
import ConnectWallet from './ConnectWallet';

interface NavbarProps {
    onWalletConnect: (publicKeyString: string) => void; // Update the type to accept a string argument
}

const Navbar: React.FC<NavbarProps> = ({ onWalletConnect }) => {
    // State to manage the open/closed state of the mobile menu
    const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
    const router = useRouter();

    // Function to toggle the mobile menu
    const toggleMenu = () => {
        setIsMenuOpen(!isMenuOpen);
    };

    return (
        <nav className="navbar">
            <div className="navbar-container">
                {/* Logo linking to home page */}
                <Link href="/" className="navbar-logo">
                    <img src="/NavbarLogo.png" alt="The Token Lab Logo" />
                </Link>
                {/* Navigation menu items */}
                <div className={`navbar-menu ${isMenuOpen ? 'active' : ''}`} style={{ display: 'flex' }}>
                    <Link href="/" className="navbar-item glow-effect">Home</Link>
                    <Link href="/docs" className="navbar-item glow-effect">Docs</Link>
                    <Link href="/dao" className="navbar-item glow-effect">DAO</Link>
                </div>
            </div>
            <div className="navbar-right">
                {/* Mobile menu toggle button */}
                <div className="menu-icon" onClick={toggleMenu}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        {/* SVG paths for menu icon, class changes based on menu state */}
                        <path className={`line ${isMenuOpen ? 'open' : ''}`} d="M3 6H21" stroke="#00FFA3" strokeWidth="2" strokeLinecap="round" />
                        <path className={`line ${isMenuOpen ? 'open' : ''}`} d="M3 12H21" stroke="#00FFA3" strokeWidth="2" strokeLinecap="round" />
                        <path className={`line ${isMenuOpen ? 'open' : ''}`} d="M3 18H21" stroke="#00FFA3" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                </div>
                {/* Wallet connection component */}
                <div className="connect-wallet-container">
                    <ConnectWallet onWalletConnect={onWalletConnect} />
                </div>
            </div>
        </nav>
    );
}

export default Navbar;
