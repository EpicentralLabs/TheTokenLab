import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Epicentral Labs',
  description: 'Your app description here',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
