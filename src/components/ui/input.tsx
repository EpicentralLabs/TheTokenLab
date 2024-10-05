import React from "react"

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export function Input({ className, ...props }: InputProps) {
  return (
    <input
      className={`px-3 py-2 rounded ${className}`}
      {...props}
    />
  )
}