import React from "react"
import { Button } from "@/components/ui/button"

export function Header() {
  return (
    <header className="flex justify-between items-center mb-12">
      <div className="flex items-center space-x-6">
        <span className="text-2xl font-bold text-[#00FFA3]">E</span>
        <nav>
          <ul className="flex space-x-4">
            <li className="hover:text-[#00FFA3] transition-colors">Home</li>
            <li className="hover:text-[#00FFA3] transition-colors">Docs</li>
            <li className="hover:text-[#00FFA3] transition-colors">DAO</li>
          </ul>
        </nav>
      </div>
      <Button className="bg-gradient-to-br from-[#00FFA3] to-cyan-400 text-black font-bold hover:from-[#00FFA3] hover:to-cyan-300 hover:shadow-lg transition-all duration-300">
        CONNECT WALLET
      </Button>
    </header>
  )
}