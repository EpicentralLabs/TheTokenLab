import React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { TokenDetailsForm } from "@/components/TokenDetailsForm"
import { TokenOptions } from "@/components/TokenOptions"
import { RevokeAuthority } from "@/components/RevokeAuthority"
import { InitializeMint } from "@/components/InitializeMint"

// MainContent component: Renders the main content of the token creation interface
export function MainContent() {
  return (
    <main className="max-w-4xl mx-auto">
      {/* Ensure no stray characters or elements are here */}
      <div className="text-center mb-12">
        <h2 className="text-xl mb-2 font-p-regular">Epicentral Labs</h2>
        <h2 className="text-sm mb-6 font-p-thin">Presents</h2>
        <h1 className="text-6xl font-p-thin mb-4 text-[#00FFA3]">The Token Lab</h1>
        <p className="text-gray-400 font-p-regular">Solana's Most Simple & Transparent Token Creator</p>
      </div>

      {/* Main card containing token creation form and options */}
      <Card className="bg-[#121212] border-[#00FFA3] border-t-2 mt-8"> {/* Add margin-top for extra space */}
        <CardContent className="p-6">
          {/* Grid layout for token details and options */}
          <div className="grid grid-cols-2 gap-8">
            <TokenDetailsForm />
            <TokenOptions />
          </div>

          {/* Additional components for authority management and minting */}
          <RevokeAuthority />
          <InitializeMint />
        </CardContent>
      </Card>
    </main>
  )
}