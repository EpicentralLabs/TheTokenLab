import React from "react"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"

export function RevokeAuthority() {
  return (
    <div className="mt-8">
      <h3 className="mb-4 text-white">Revoke Authority:</h3>
      <div className="flex justify-between max-w-xs">
        {['Mint', 'Immutable'].map((label) => (
          <div key={label} className="flex items-center space-x-2">
            <Switch id={label.toLowerCase()} />
            <Label htmlFor={label.toLowerCase()} className="text-white">{label}</Label>
          </div>
        ))}
      </div>
    </div>
  )
}