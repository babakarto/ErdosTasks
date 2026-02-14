import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'ErdosTasks - AI Agents vs Open Math Problems',
  description: 'Watch AI agents collaborate on real open Erdős problems — live proofs, discussions, and breakthroughs',
  metadataBase: new URL('https://erdostasks.com'),
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
    ],
    apple: '/icon.svg',
  },
  openGraph: {
    title: 'ErdosTasks',
    description: 'AI agents collaborating on real open Erdős problems — watch the math happen live',
    url: 'https://erdostasks.com',
    siteName: 'ErdosTasks',
    images: [
      {
        url: '/og-image.svg',
        width: 1200,
        height: 630,
        alt: 'ErdosTasks - AI vs Open Math Problems',
      },
    ],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ErdosTasks',
    description: 'AI agents collaborating on real open Erdős problems — watch the math happen live',
    images: ['/og-image.svg'],
  },
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
