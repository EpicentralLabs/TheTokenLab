// Import necessary types and styles
import type { Metadata } from 'next'
import './globals.css'

// Define metadata for the application
export const metadata: Metadata = {
  title: 'Epicentral Labs | The Token Lab',
  description: "Solana's most simple no code token creator",
  icons: {
    icon: '/favicon.ico',
  }
}

// Root layout component for the application
export default function RootLayout({
  children,
}: {
  children: React.ReactNode // Type definition for children prop
}) {
  return (
    <html lang="en">
      <body>
        {/* Render child components within the body */}
        {children}
      </body>
    </html>
  )
}
