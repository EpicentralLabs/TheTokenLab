import React from "react"
import { Button } from "@/components/ui/button"
import Image from "next/image"

// Header component: Renders the top navigation bar and wallet connection button
export function Header() {
  return (
    <header className="flex justify-between items-center mb-12">
      {/* Left side of the header with logo and navigation */}
      <div className="flex items-center space-x-6">
        {/* Logo */}
        <Image src="/navbar-logo.png" alt="Epicentral Labs Logo" width={32} height={32} />
        {/* Navigation menu */}
        <nav>
          <ul className="flex space-x-4">
            {/* Navigation items with hover effect */}
            <li className="hover:text-[#00FFA3] transition-colors">Home</li>
            <li className="hover:text-[#00FFA3] transition-colors">Docs</li>
            <li className="hover:text-[#00FFA3] transition-colors">DAO</li>
          </ul>
        </nav>
      </div>
      {/* Wallet connection button with gradient background and hover effects */}
      <Button className="bg-gradient-to-br from-[#00FFA3] to-cyan-400 text-black font-bold hover:from-[#00FFA3] hover:to-cyan-300 hover:shadow-lg transition-all duration-300">
        CONNECT WALLET
      </Button>
    </header>
  )
}