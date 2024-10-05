import React from "react";

interface WarningLabelProps {
  visible: boolean;
  message: string;
}

export function WarningLabel({ visible, message }: WarningLabelProps) {
  return (
    <div
      className={`transition-opacity duration-500 ${
        visible ? "opacity-100" : "opacity-0"
      } text-red-500 bg-gray-800 p-4 rounded-lg mt-4`}
    >
      {message}
    </div>
  );
}