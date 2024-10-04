import React from 'react'
import './Switches.css'

// MintSwitch component for toggling the mint functionality
function MintSwitch({ isChecked, setIsChecked }) {

  // Handler for checkbox change
  const handleChange = () => {
    setIsChecked(!isChecked)
  }

  // Convert boolean to string for value attribute
  const mintBool = isChecked ? 'true' : 'false'

  return (
    <div className="switch-container">
      <div className="switch-text">Mint Authority</div>
      <label className="switch">
        <input
          type="checkbox"
          name="mint"
          value={mintBool}
          checked={isChecked}
          onChange={handleChange}
        />
        {/* Slider span for custom switch appearance */}
        <span className="slider"></span>
      </label>
    </div>
  )
}

// Export the component for use in other parts of the application
export default MintSwitch