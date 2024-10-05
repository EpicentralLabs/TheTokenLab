import React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { TokenDetailsForm } from "@/components/TokenDetailsForm"
import { TokenOptions } from "@/components/TokenOptions"
import { RevokeAuthority } from "@/components/RevokeAuthority"
import { InitializeMint } from "@/components/InitializeMint"

export function MainContent() {
  return (
    <main className="max-w-4xl mx-auto">
      <div className="text-center mb-12">
        <h2 className="text-xl mb-2">Epicentral Labs</h2>
        <h2 className="text-sm mb-6">Presents</h2>
        <h1 className="text-6xl font-bold mb-4 text-[#00FFA3]">The Token Lab</h1>
        <p className="text-gray-400">Solana's Most Simple & Transparent Token Creator</p>
      </div>

      <Card className="bg-gray-900 border-[#00FFA3] border-t-2">
        <CardContent className="p-6">
          <div className="grid grid-cols-2 gap-8">
            <TokenDetailsForm />
            <TokenOptions />
          </div>

          <RevokeAuthority />
          <InitializeMint />
        </CardContent>
      </Card>
    </main>
  )
}