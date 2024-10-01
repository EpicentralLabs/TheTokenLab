// Import React library for component creation
import React from 'react'
import './ZKWarningMessage.css'

// Define the WarningMessage functional component
function ZKWarningMessage() {
  return (
    // Render a div with warning message and styling classes
   
     <div className="zk-warning-message fade-in">
        Enableing ZK Compression currently DOES NOT attatch metadeta upon initializing the token mint
      </div>
  
  )
}

// Export the WarningMessage component for use in other parts of the application
export default ZKWarningMessage