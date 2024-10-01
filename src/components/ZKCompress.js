import React, { useState} from 'react';
import './ZKWarningMessage.css';
import './Switches.css';

function Compress({ 
    showWarning,
    quantity, 
    decimals,  
    setIsQuantityError, 
    setIsDecimalsError,
    isChecked,
    setIsChecked,
  }) {

    const ZKbool = isChecked ? 'true' : 'false'
    
    const handleChange = () => {setIsChecked(!isChecked)};

    
    function ZKWarningMessage() {
      return (
        // Render a div with warning message and styling classes
       
         <div className="zk-warning-message fade-in">
            Enableing ZK Compression currently DOES NOT attatch metadeta upon initializing the token mint
          </div>
      
      )
    }

    return (
      <div className="switch-container">
       
      <div className="switch-text">Use ZK Compression</div>
      
      <label className="switch">
        <input
          type="checkbox"
          name="ZKCompress"
          value={ZKbool}
          checked={isChecked}
          onChange={handleChange}
        />
        {/* Slider span for custom switch appearance */}
        <span className="slider"></span>
      </label>
       {(isChecked) && (<ZKWarningMessage />)}
    </div>
    );
}

export default Compress;