import { Inter } from 'next/font/google'
import './globals.css'
import PWAInstall from '../components/PWAInstall'
import OfflineIndicator from '../components/OfflineIndicator'
import PWAInitializer from '../components/PWAInitializer'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'UPI Progressive Web App',
  description: 'A comprehensive Progressive Web App for secure UPI transactions with offline support and QR code scanning',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'UPI PWA'
  },
  formatDetection: {
    telephone: false
  },
  icons: {
    icon: [
      { url: '/icon-192x192.svg', sizes: '192x192', type: 'image/svg+xml' },
      { url: '/icon-512x512.svg', sizes: '512x512', type: 'image/svg+xml' }
    ],
    apple: [
      { url: '/icon-192x192.svg', sizes: '192x192', type: 'image/svg+xml' }
    ]
  },
  other: {
    'mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-title': 'UPI PWA',
    'application-name': 'UPI PWA',
    'msapplication-TileColor': '#3b82f6',
    'msapplication-config': '/browserconfig.xml'
  }
}

export const viewport = {
  themeColor: '#3b82f6',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: 'no',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/icon-192x192.svg" />
        <link rel="apple-touch-icon" href="/icon-192x192.svg" />
        <link rel="shortcut icon" href="/icon-192x192.svg" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="theme-color" content="#3b82f6" />
        <meta name="color-scheme" content="light" />
        <meta name="supported-color-schemes" content="light" />
      </head>
      <body className={inter.className}>
        <PWAInitializer />
        <OfflineIndicator />
        <div className="min-h-screen bg-gray-50">
          {children}
        </div>
        <PWAInstall />
      </body>
    </html>
  )
}
