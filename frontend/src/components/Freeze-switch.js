import React from "react";
import "./Switches.css";

// FreezeSwitch component for toggling the freeze functionality
function FreezeSwitch({ isChecked, setIsChecked }) {

    // Handler for checkbox change
    const handleChange = () => {
        setIsChecked(!isChecked);
    }

    // Convert boolean to string for value attribute
    let freezeBool = isChecked ? "true" : "false";

    return (
        <div className="switch-container">
            <div className="switch-text">Freeze</div>
            <label className="switch">
                <input type="checkbox" 
                name="freeze" 
                value={freezeBool} 
                checked={isChecked} 
                onChange={handleChange} 
                />
                {/* Slider span for custom switch appearance */}
                <span className="slider"></span>
            </label>
        </div>
    );
}

// Export the component for use in other parts of the application
export default FreezeSwitch;