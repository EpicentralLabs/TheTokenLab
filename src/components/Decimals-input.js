import React from 'react'
import './Input-list.css'

// DecimalsInput component for handling token decimal input
function DecimalsInput({ decimals, setDecimals, isError }) {
  // Handler for input changes
  const handleChange = (e) => {
    const value = e.target.value
    // Allow empty input or numbers up to 9
    if (value === '' || (!isNaN(value) && parseInt(value, 10) >= 0 && parseInt(value, 10) <= 9)) {
      setDecimals(value)
    }
  }

  return (
    <h1 className="container">
      <div className="Input-bubble-box">
        <label htmlFor="token-decimals" className="input-label">Decimals: </label>
        <div className="input-container">
          <input
            name="decimals"
            type="text"
            id="token-decimals"
            className={`input-bubble ${isError ? 'error' : ''}`}
            value={decimals}
            onChange={handleChange}
          />
          {/* Info bubble with tooltip for additional information */}
          <div className="info-bubble">
            <div className="tooltip">Define the number of decimal places after the whole number. (Max. 9 Decimals)</div>
          </div>
        </div>
      </div>
    </h1>
  )
}

// Export the component for use in other parts of the application
export default DecimalsInput