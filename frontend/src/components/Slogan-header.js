// Import React library for component creation
import React from 'react';
// Import CSS styles specific to the Slogan header
import './Slogan-header.css';

// Define the SloganHeader functional component
function SloganHeader() {
    return (
        // Render an h3 element with the Slogan-header class
        <h3 className="Slogan-header">
            Solana's Most Simple & Transparent Token Creator
        </h3>
    );
}

// Export the SloganHeader component for use in other parts of the application
export default SloganHeader;