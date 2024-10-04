import React from 'react';
import './Error-message.css';

// ErrorMessage component for displaying error messages
const ErrorMessage: React.FC = () => {
    return (
        <div className="error-message fade-in">
            These fields must be filled in order to initialize mint!
        </div>
    );
}

export default ErrorMessage;
