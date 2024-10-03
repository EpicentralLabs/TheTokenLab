import React, { useState } from 'react';
import './Input-list.css';

// DescriptionInput component for handling token description input
const DescriptionInput: React.FC = () => {
  // State to store the description value
  const [description, setDescription] = useState<string>('');

  // Handler for input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Update state only if the input length is within the limit
    if (value.length <= 80) {
      setDescription(value);
    }
    // Note: If the input exceeds 80 characters, it's silently ignored
  };

  return (
      <h1 className="container">
        <div className="Input-bubble-box">
          <label htmlFor="token-description" className="input-label">Description: </label>
          <div className="input-container">
            <input
                name="description"
                type="text"
                id="token-description"
                className="input-bubble"
                value={description}
                onChange={handleChange}
                maxLength={80} // Enforce max length on the input element (HTML5 attribute)
            />
            {/* Info bubble with tooltip for additional information */}
            <div className="info-bubble">
              <div className="tooltip">Share a brief description of the token and what it may be used for (max 80 characters).</div>
            </div>
          </div>
        </div>
      </h1>
  );
}

// Export the component for use in other parts of the application
export default DescriptionInput;
