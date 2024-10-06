import React from "react"

// Define the ButtonProps interface, extending React's button HTML attributes
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode // Ensure the button can accept child elements
}

// Button component: Renders a customizable button element
export function Button({ children, className, ...props }: ButtonProps) {
  return (
    <button
      // Apply default styles and merge with any additional className provided
      className={`px-4 py-2 rounded ${className}`}
      // Spread any additional props passed to the component
      {...props}
    >
      {children}
    </button>
  )
}