import React from "react"

// Define the props interface for the Card component
interface CardProps {
  children: React.ReactNode
  className?: string
}

// Card component: Renders a customizable card container
export function Card({ children, className }: CardProps) {
  return (
    // Apply default styles for a card and merge with any additional className provided
    <div className={`rounded-lg shadow-md ${className}`}>
      {children}
    </div>
  )
}

// Define the props interface for the CardContent component
interface CardContentProps {
  children: React.ReactNode
  className?: string
}

// CardContent component: Renders the content area within a Card
export function CardContent({ children, className }: CardContentProps) {
  return (
    // Apply default padding and merge with any additional className provided
    <div className={`p-4 ${className}`}>
      {children}
    </div>
  )
}