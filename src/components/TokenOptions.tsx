import React, { useState } from "react"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { FolderIcon } from "lucide-react"
import { WarningLabel } from "@/components/ui/WarningLabel"

export function TokenOptions() {
  const [showZKWarning, setShowZKWarning] = useState(false);

  const handleZKToggle = (checked: boolean) => {
    setShowZKWarning(checked);
  };

  return (
    <div className="space-y-6 text-center">
      <div>
        <Label className="text-white">Token Image:</Label>
        <div className="border-2 border-dashed border-gray-600 rounded-lg p-12 text-center hover:border-[#00FFA3] transition-colors cursor-pointer">
          <FolderIcon className="mx-auto mb-4 text-[#00FFA3]" size={48} />
          <p className="text-white">Choose a file</p>
        </div>
      </div>
      <div className="flex flex-col items-center space-y-2">
        <Label htmlFor="zkCompression" className="text-white">Use ZK Compression</Label>
        <Switch id="zkCompression" onCheckedChange={handleZKToggle} />
        <WarningLabel 
          visible={showZKWarning} 
          message="WARNING: Currently metadata for ZK Compressed tokens is not available."
        />
      </div>
    </div>
  )
}