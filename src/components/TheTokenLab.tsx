'use client'

import React from "react"
import { Header } from "./Header"
import { MainContent } from "./MainContent"
import { Footer } from "./Footer"

// TokenCreator component: The main container for the token creation interface
export default function TokenCreator() {
  return (
    // Main container with full height, dark background, and padding
    <div className="min-h-screen bg-[#121212] text-white p-8">
      {/* Header component for navigation and wallet connection */}
      <Header />
      {/* MainContent component containing the token creation form and options */}
      <MainContent />
      {/* Footer component for additional information or links */}
      <Footer />
    </div>
  )
}