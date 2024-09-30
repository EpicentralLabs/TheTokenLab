import React, { useState} from 'react';
import './Switches.css';
import ErrorMessageZK from './Error-message-ZK';
import SuccessMessage from './InitalizingMint-message'

function Compress({ 
    quantity, 
    decimals,  
    setIsQuantityError, 
    setIsDecimalsError,
    isChecked,
    setIsChecked,
  }) {

    const ZKbool = isChecked ? 'true' : 'false'
    
    const handleChange = () => {setIsChecked(!isChecked)};

    


    
   

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
    </div>
    );
}

export default Compress;