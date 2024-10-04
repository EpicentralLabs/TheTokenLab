import React from 'react';
// Import CSS styles specific to the Sub-header component
import './Sub-header.css';

// Define the SubHeader functional component
const SubHeader: React.FC = () => {
    return (
        // Render an h3 element with the Sub-header class
        <h3 className="Sub-header">
            Presents
        </h3>
    );
}

// Export the SubHeader component for use in other parts of the application
export default SubHeader;
