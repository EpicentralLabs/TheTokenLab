import React, { useState } from "react"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { WarningLabel } from "@/components/ui/WarningLabel"

// RevokeAuthority component: Allows users to revoke minting authority and set token immutability
export function RevokeAuthority() {
  const [showWarning, setShowWarning] = useState(false);

  const handleToggle = (checked: boolean) => {
    setShowWarning(checked);
  };

  return (
    <div className="mt-8 text-center"> {/* Center the entire section */}
      <h3 className="mb-4 text-white">Revoke Authority:</h3>
      <div className="flex justify-center space-x-12"> {/* Increase space between switches */}
        {['Mint', 'Immutable'].map((label) => (
          <div key={label} className="flex flex-col items-center space-y-2"> {/* Center each switch and label */}
            <Label htmlFor={label.toLowerCase()} className="text-white">{label}</Label>
            <Switch id={label.toLowerCase()} onCheckedChange={handleToggle} />
          </div>
        ))}
      </div>
      {showWarning && (
        <WarningLabel 
          visible={true}
          message="WARNING: Revoking Mint and/or Immutable Authority is irreversible. Freeze Authority is removed by default."
        />
      )}
    </div>
  )
}