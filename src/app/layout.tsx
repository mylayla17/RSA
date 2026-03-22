/**
 * Sovereign Reserve Agent - Root Layout
 * Next.js 14 App Router Configuration
 */

import type { Metadata, Viewport } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';

// ═══════════════════════════════════════════════════════════════════════════
// FONT CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-mono',
});

// ═══════════════════════════════════════════════════════════════════════════
// METADATA CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

export const metadata: Metadata = {
  title: 'Sovereign Reserve Agent',
  description: 'Autonomous DeFi Agent for USD₮/XAU₮ Liquidity Rebalancing | DoraHacks Galactica 2026',
  keywords: [
    'DeFi',
    'Tether',
    'USDt',
    'XAUt',
    'Autonomous Agent',
    'AI Trading',
    'Liquidity Management',
    'Blockchain',
    'Ethereum',
    'DoraHacks',
    'Galactica 2026'
  ],
  authors: [{ name: 'Sovereign Reserve Team' }],
  creator: 'Sovereign Reserve Agent',
  publisher: 'Sovereign Reserve',
  applicationName: 'Sovereign Reserve Agent',
  robots: {
    index: false,
    follow: false,
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/icon.svg', type: 'image/svg+xml' },
    ],
    apple: '/apple-touch-icon.png',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    title: 'Sovereign Reserve Agent',
    description: 'Autonomous DeFi Agent for USD₮/XAU₮ Liquidity Rebalancing',
    siteName: 'Sovereign Reserve Agent',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Sovereign Reserve Agent',
    description: 'Autonomous DeFi Agent for USD₮/XAU₮ Liquidity Rebalancing',
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#0a0a0a' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0a0a' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

// ═══════════════════════════════════════════════════════════════════════════
// ROOT LAYOUT COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html 
      lang="en" 
      className={`${inter.variable} ${jetbrainsMono.variable}`}
      suppressHydrationWarning
    >
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body 
        className={`
          font-sans antialiased
          bg-black text-white
          min-h-screen
          selection:bg-blue-500/30 selection:text-white
          ${jetbrainsMono.variable}
        `}
        suppressHydrationWarning
      >
        {/* Skip to main content for accessibility */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded-lg"
        >
          Skip to main content
        </a>

        {/* Main Application Container */}
        <main id="main-content" className="relative">
          {children}
        </main>

        {/* Background Noise Texture Overlay */}
        <div 
          className="fixed inset-0 pointer-events-none z-0 opacity-[0.015]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          }}
          aria-hidden="true"
        />
      </body>
    </html>
  );
}
