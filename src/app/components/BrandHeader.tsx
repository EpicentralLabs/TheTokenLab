import React from 'react';
import './Brand-header.css'; // Import the associated CSS file for styling

// BrandHeader component: Renders the main brand header
const BrandHeader: React.FC = () => {
    return (
        <div className="Brand-header">
            {/* Display the company name as an h1 heading */}
            <h1>Epicentral Labs</h1>
        </div>
    );
};

export default BrandHeader; // Export the component for use in other parts of the application
