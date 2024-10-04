import React, { useState} from 'react';
import './ZKWarningMessage.css';
import './Switches.css';

function Compress({ 
    
  }) {

    

    const [zkChecked, setZKChecked] = useState(false)

    const handleZKChange = () => {setZKChecked(!zkChecked)};

    const ZKbool = zkChecked ? 'true' : 'false'

    
    function ZKWarningMessage() {
      return (
        // Render a div with warning message and styling classes
       
         <div className="zk-warning-message fade-in">
            Enabling ZK Compression currently DOES NOT attach metadata upon token initialization!
          </div>
      
      )
    }

    return (
      <div className="zk-switch-container">
       
      <div className="zk-switch-text">Use ZK Compression</div>
      
      <label className="zk-switch">
        <input
          type="checkbox"
          name="ZKCompress"
          value={ZKbool}
          checked={zkChecked}
          onChange={handleZKChange}
        />
        {/* Slider span for custom switch appearance */}
        <span className="zk-slider"></span>
      </label>
      <div className="warning-box">
        {(zkChecked) && (<ZKWarningMessage/>)}
      </div>
    </div>
    );
}

export default Compress;