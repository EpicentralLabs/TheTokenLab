import React from 'react'
import './Input-list.css'

// DecimalsInput component for handling token decimal input
function DecimalsInput({ decimals, setDecimals, isError }) {
  // Handler for input changes
  const handleChange = (e) => {
    const value = e.target.value
    if (value === '' || (!isNaN(value) && parseInt(value, 10) <= 12)) {
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
            <div className="tooltip">Define how fractionalized the token will be. (Max. 12 Decimals)</div>
          </div>
        </div>
      </div>
    </h1>
  )
}

// Export the component for use in other parts of the application
export default DecimalsInput