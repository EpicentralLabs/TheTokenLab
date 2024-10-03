import React from 'react';
import './ZKWarningMessage.css';

function Compress({isChecked, setIsChecked}) {

  

    const handleChange = () => {setIsChecked(!isChecked)};

    const ZKbool = isChecked ? 'true' : 'false'


    return (
      <div className="zk-switch-container">
       
        <div className="zk-switch-text">Use ZK Compression</div>
      
        <label className="zk-switch">
          <input
            type="checkbox"
            name="ZKCompress"
            value={ZKbool}
            checked={isChecked}
            onChange={handleChange}
          />
          {/* Slider span for custom switch appearance */}
          <span className="zk-slider"></span>
        </label>
      </div>
    );
}

export default Compress;