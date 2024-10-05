import React from "react"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"

// RevokeAuthority component: Allows users to revoke minting authority and set token immutability
export function RevokeAuthority() {
  return (
    <div className="mt-8">
      <h3 className="mb-4 text-white">Revoke Authority:</h3>
      <div className="flex justify-between max-w-xs">
        {/* Map through authority options */}
        {['Mint', 'Immutable'].map((label) => (
          <div key={label} className="flex items-center space-x-2">
            {/* Switch component for toggling authority */}
            <Switch id={label.toLowerCase()} />
            {/* Label for the switch */}
            <Label htmlFor={label.toLowerCase()} className="text-white">{label}</Label>
          </div>
        ))}
      </div>
    </div>
  )
}