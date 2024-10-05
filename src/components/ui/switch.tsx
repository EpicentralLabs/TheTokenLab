import React from "react"

interface SwitchProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export function Switch({ className, ...props }: SwitchProps) {
  return (
    <input
      type="checkbox"
      className={`toggle-switch ${className}`}
      {...props}
    />
  )
}