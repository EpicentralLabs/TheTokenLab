"use client"

import * as React from "react"
import * as SwitchPrimitives from "@radix-ui/react-switch"


// Define a simple cn function if it's not available
// This function joins class names, filtering out falsy values
const cn = (...classes: string[]) => classes.filter(Boolean).join(' ');

// Define the Switch component using forwardRef for proper ref handling
// Define the Switch component using forwardRef for proper ref handling
const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root>
>(({ className, ...props }, ref) => (
  <SwitchPrimitives.Root
    // Apply styles using the cn function, combining default styles with any passed className
    // Styles include sizing, cursor behavior, rounded corners, and state-based colors
    className={cn(
      "peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=unchecked]:bg-input",
      className || ""
    )}
    {...props}
    ref={ref}
  >
    {/* Thumb component of the switch */}
    {/* Styles control the appearance and movement of the switch thumb */}
    <SwitchPrimitives.Thumb
      className={cn(
        "pointer-events-none block h-5 w-5 rounded-full bg-background shadow-lg ring-0 transition-transform data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0"
      )}
    />
  </SwitchPrimitives.Root>
))

// Set display name for better debugging in React DevTools
Switch.displayName = SwitchPrimitives.Root.displayName

// Export the Switch component for use in other parts of the application
export { Switch }