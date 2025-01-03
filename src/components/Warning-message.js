// Import React library for component creation
import React from 'react'

// Define the WarningMessage functional component
function WarningMessage() {
  return (
    // Render a div with warning message and styling classes
    <div className="warning-message fade-in">
      Removing Mint and or Update Authority is irreversible! (Freeze Authority is removed by default)
    </div>
  )
}

// Export the WarningMessage component for use in other parts of the application
export default WarningMessage
