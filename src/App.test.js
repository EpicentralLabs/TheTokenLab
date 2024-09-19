// Import necessary dependencies
import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';

// Test case to ensure the App component renders without crashing
it('renders without crashing', () => {
  // Create a div element to render the App component
  const div = document.createElement('div');
  
  // Render the App component into the created div
  ReactDOM.render(<App />, div);
  
  // Note: ReactDOM.render doesn't throw errors, so if this line is reached,
  // it means the component rendered successfully
});
