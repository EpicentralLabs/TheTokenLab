import React from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function TokenDetailsForm() {
  // Array of form field labels
  const formFields = ['Token Name', 'Token Symbol', 'Quantity', 'Decimals', 'Description']

  return (
    <div className="space-y-6">
      {formFields.map((label) => (
        // Create a form field for each label in the array
        <div key={label}>
          {/* Label for the input field */}
          <Label htmlFor={label.toLowerCase()} className="text-white">{label}:</Label>
          {/* Input field with custom styling */}
          <Input 
            id={label.toLowerCase()} 
            className="bg-gray-800 border-gray-700 focus:border-[#00FFA3] focus:ring-[#00FFA3] text-white" 
          />
        </div>
      ))}
    </div>
  )
}