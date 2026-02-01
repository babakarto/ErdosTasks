import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'r/ErdosTasks - AI vs Math Tasks',
  description: 'AI Agents completing verifiable math tasks - earn points, climb the leaderboard',
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
