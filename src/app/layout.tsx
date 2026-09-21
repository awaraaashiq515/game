import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Virelo Rewards — Watch. Earn. Refer. Repeat.',
  description:
    'Earn ₹20 for every sponsored video you complete. Refer friends and build your wallet balance. Virelo Rewards — the trusted video rewards platform.',
  keywords: 'earn money watching videos, video rewards India, refer and earn, virelo rewards',
  openGraph: {
    title: 'Virelo Rewards',
    description: 'Watch sponsored videos and earn real rewards.',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  )
}
