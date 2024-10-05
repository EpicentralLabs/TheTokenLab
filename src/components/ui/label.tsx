import React from "react"

// Define the props interface for the Label component
interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  children: React.ReactNode
}

// Label component: Renders a customizable label element
export function Label({ children, className, ...props }: LabelProps) {
  return (
    <label
      // Apply default styles and merge with any additional className provided
      className={`block font-medium ${className}`}
      // Spread any additional props passed to the component
      {...props}
    >
      {children}
    </label>
  )
}