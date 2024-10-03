import React from 'react';
import './Footer.css';

// Define the Footer functional component
const Footer: React.FC = () => {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="App-footer">
            <div className="footer-content">
                <p>&copy; {currentYear} Epicentral Labs</p>
                <img src="/solanaLogo.png" alt="Solana Logo" className="solana-logo" />
            </div>
        </footer>
    );
};

export default Footer;
