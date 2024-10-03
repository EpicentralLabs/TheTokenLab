import React from 'react';
import './Switches.css';

// Define the props interface for ImmutableSwitch
interface ImmutableSwitchProps {
    isChecked: boolean;
    setIsChecked: (checked: boolean) => void;
}

// ImmutableSwitch component for toggling the immutable functionality
const ImmutableSwitch: React.FC<ImmutableSwitchProps> = ({ isChecked, setIsChecked }) => {

    // Handler for checkbox change
    const handleChange = () => {
        setIsChecked(!isChecked);
    }

    // Convert boolean to string for value attribute
    const immuteBool = isChecked ? 'true' : 'false';

    return (
        <div className="switch-container">
            <div className="switch-text">Update Authority</div>
            <label className="switch">
                <input
                    type="checkbox"
                    name="immutable"
                    value={immuteBool}
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
export default ImmutableSwitch;
