import React from "react";

// Define the props interface for the WarningLabel component
interface WarningLabelProps {
  visible: boolean; // Controls the visibility of the warning
  message: string;  // The warning message to display
}

// WarningLabel component: Displays a warning message with fade-in/out effect
export function WarningLabel({ visible, message }: WarningLabelProps) {
  return (
    <div
      className={`
        transition-opacity duration-500 
        ${visible ? "opacity-100" : "opacity-0"}
        text-red-500 bg-gray-800 p-4 rounded-lg mt-4
      `}
    >
      {message}
    </div>
  );
}