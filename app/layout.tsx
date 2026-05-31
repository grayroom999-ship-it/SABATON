import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from 'react-hot-toast'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Buea Leather Shoes | Quality Men\'s Footwear',
  description: 'Premium leather shoes for men in Buea, Cameroon. Free delivery in Molyko, Mile 17, and surrounding areas. Shop casual, formal, and boots.',
  keywords: 'leather shoes Buea, men footwear Cameroon, quality shoes, handcrafted leather',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {children}
        <Toaster position="bottom-right" />
      </body>
    </html>
  )
}