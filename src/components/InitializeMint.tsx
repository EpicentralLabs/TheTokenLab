import React from "react"
import { Button } from "@/components/ui/button"

// InitializeMint component: Renders options for initializing a new token mint
export function InitializeMint() {
  return (
    <div className="mt-8">
      <h3 className="mb-4 text-white">Initialize Mint:</h3>
      <div className="flex space-x-4">
        {/* Array of payment options */}
        {[
          { label: '0.05 SOL', value: '≈ $7.16' },
          { label: '5,000 LABS', value: '≈ $2.68' }
        ].map(({ label, value }) => (
          // Button for each payment option
          <Button 
            key={label} 
            className="bg-gradient-to-br from-[#00FFA3] to-cyan-400 text-black font-bold hover:from-[#00FFA3] hover:to-cyan-300 hover:shadow-lg transition-all duration-300"
          >
            {label}
            {/* Approximate USD value */}
            <span className="text-xs block">{value}</span>
          </Button>
        ))}
        {/* Separator between payment options */}
        <span className="self-center text-white">or</span>
      </div>
    </div>
  )
}