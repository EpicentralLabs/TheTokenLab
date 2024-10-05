import React from "react"
import { Button } from "@/components/ui/button"

// InitializeMint component: Renders options for initializing a new token mint
export function InitializeMint() {
  return (
    <div className="mt-8 text-center bg-[#121212] p-4 rounded-lg"> {/* Center the entire section and set background color */}
      <h3 className="mb-4 text-white">Initialize Mint:</h3>
      <div className="flex justify-center items-center space-x-4"> {/* Center the buttons and "or" */}
        {/* Array of payment options */}
        {[
          { label: '0.05 SOL', value: '≈ $7.16' },
          { label: '5,000 LABS', value: '≈ $2.68' }
        ].map(({ label, value }, index) => (
          <React.Fragment key={label}>
            {/* Button for each payment option */}
            <Button 
              className="bg-gradient-to-br from-[#00FFA3] to-cyan-400 text-black font-bold hover:from-[#00FFA3] hover:to-cyan-300 hover:shadow-lg transition-all duration-300 transform hover:scale-110 w-40" // Ensure same size
            >
              {label}
              {/* Approximate USD value */}
              <span className="text-xs block">{value}</span>
            </Button>
            {/* Separator between payment options */}
            {index === 0 && <span className="text-white">or</span>}
          </React.Fragment>
        ))}
      </div>
    </div>
  )
}