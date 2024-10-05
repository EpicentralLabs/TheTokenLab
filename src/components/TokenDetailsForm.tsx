import React from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function TokenDetailsForm() {
  return (
    <div className="space-y-6">
      {['Token Name', 'Token Symbol', 'Quantity', 'Decimals', 'Description'].map((label) => (
        <div key={label}>
          <Label htmlFor={label.toLowerCase()} className="text-white">{label}:</Label>
          <Input id={label.toLowerCase()} className="bg-gray-800 border-gray-700 focus:border-[#00FFA3] focus:ring-[#00FFA3] text-white" />
        </div>
      ))}
    </div>
  )
}