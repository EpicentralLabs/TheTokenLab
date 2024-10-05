import React from "react"

// Define the InputProps interface, extending React's input HTML attributes
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

// Input component: Renders a customizable input element
export function Input({ className, ...props }: InputProps) {
  return (
    <input
      // Apply default styles and merge with any additional className provided
      className={`px-3 py-2 rounded ${className}`}
      // Spread any additional props passed to the component
      {...props}
    />
  )
}