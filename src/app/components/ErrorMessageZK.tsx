import React from 'react';
import './Error-message.css';

// ErrorMessageZK component for displaying error messages
const ErrorMessageZK: React.FC = () => {
    return (
        <div className="error-message fade-in">
            These fields must be filled in order to process compression!
        </div>
    );
}

export default ErrorMessageZK;
