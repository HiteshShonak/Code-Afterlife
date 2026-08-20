import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import 'lenis/dist/lenis.css';
import 'highlight.js/styles/tokyo-night-dark.css';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
  weight: ['400', '500', '600', '800'],
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-jetbrains-mono',
  weight: ['400', '500'],
});

export const metadata: Metadata = {
  metadataBase: new URL('https://codeafterlife.vercel.app'),
  title: {
    default: 'Code Afterlife | Software Never Dies',
    template: '%s | Code Afterlife',
  },
  description:
    'A platform for abandoned software projects to be rediscovered, inherited, and revived. Projects decay. Builders disappear. Code survives.',
  keywords: ['open source', 'abandoned projects', 'software revival', 'developer platform', 'code legacy', 'legacy code'],
  authors: [{ name: 'Code Afterlife Team' }],
  creator: 'Code Afterlife',
  openGraph: {
    title: 'Code Afterlife | Software Never Dies',
    description: 'Rediscover, inherit, and revive abandoned software projects.',
    url: 'https://codeafterlife.vercel.app',
    siteName: 'Code Afterlife',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Code Afterlife | Software Never Dies',
    description: 'Rediscover, inherit, and revive abandoned software projects.',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: [
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/android-chrome-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/android-chrome-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180' },
    ],
  },
  manifest: '/site.webmanifest',
  alternates: {
    canonical: '/',
  },
};

import { SmoothScroll } from "@/components/providers/SmoothScroll";

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body className="antialiased">
        <SmoothScroll>{children}</SmoothScroll>
      </body>
    </html>
  );
}
