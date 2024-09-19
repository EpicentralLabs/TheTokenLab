import React from 'react'
import './Footer.css'

function Footer() {
  return (
    <footer className="App-footer">
      <div className="footer-content">
        <p>&copy; 2024 Epicentral Labs</p>
        <img src="/solanaLogo.png" alt="Solana Logo" className="solana-logo" />
      </div>
    </footer>
  )
}

export default Footer