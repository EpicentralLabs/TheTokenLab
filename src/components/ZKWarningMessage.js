import React from 'react';

function ZKWarningMessage() {
    return (
      // Render a div with warning message and styling classes
     
       <div className="zk-warning-message fade-in">
          Enabling ZK Compression currently DOES NOT attach metadata upon token initialization!
        </div>
    
    )
  }

export default ZKWarningMessage;