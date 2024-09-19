// Import React library for component creation
import React from 'react';
// Import CSS styles specific to the TokenLab-header component
import './TokenLab-header.css';

// Define the TokenLabTitle functional component
function TokenLabTitle() {
    return (
        // Render an h1 element with the TokenLab-header class
        <h1 className="TokenLab-header">
            The Token Lab
        </h1>
    );
}

// Export the TokenLabTitle component for use in other parts of the application
export default TokenLabTitle;