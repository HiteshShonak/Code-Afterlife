import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Code Afterlife — Software Never Dies',
  description:
    'A platform for abandoned software projects to be rediscovered, inherited, and revived. Projects decay. Builders disappear. Code survives.',
  keywords: ['open source', 'abandoned projects', 'software revival', 'developer platform'],
  openGraph: {
    title: 'Code Afterlife — Software Never Dies',
    description: 'Rediscover, inherit, and revive abandoned software projects.',
    type: 'website',
  },
  icons: {
    icon: [
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180' },
    ],
  },
  manifest: '/site.webmanifest',
};

import { SmoothScroll } from "@/components/providers/SmoothScroll";

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <SmoothScroll>{children}</SmoothScroll>
      </body>
    </html>
  );
}
