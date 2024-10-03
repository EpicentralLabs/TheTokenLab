import React from "react";
import "./Switches.css";

// Define the props interface for FreezeSwitch
interface FreezeSwitchProps {
    isChecked: boolean;            // State indicating if the switch is checked
    setIsChecked: (checked: boolean) => void; // Function to update the checked state
}

// FreezeSwitch component for toggling the freeze functionality
const FreezeSwitch: React.FC<FreezeSwitchProps> = ({ isChecked, setIsChecked }) => {

    // Handler for checkbox change
    const handleChange = () => {
        setIsChecked(!isChecked);
    };

    // Convert boolean to string for value attribute
    const freezeBool = isChecked ? "true" : "false";

    return (
        <div className="switch-container">
            <div className="switch-text">Freeze</div>
            <label className="switch">
                <input
                    type="checkbox"
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
};

// Export the component for use in other parts of the application
export default FreezeSwitch;
