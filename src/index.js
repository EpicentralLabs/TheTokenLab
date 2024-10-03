// Import necessary dependencies
import React from 'react';
import ReactDOM from 'react-dom';
import App from './App.jsx';
import './index.css';

// Render the App component inside React's StrictMode
ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  // Mount the app to the DOM element with id 'root'
  document.getElementById('root')
);
