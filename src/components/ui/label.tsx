import React from "react"

interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  children: React.ReactNode
}

export function Label({ children, className, ...props }: LabelProps) {
  return (
    <label
      className={`block font-medium ${className}`}
      {...props}
    >
      {children}
    </label>
  )
}