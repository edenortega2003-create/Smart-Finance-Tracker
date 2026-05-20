import './globals.css';
import type { Metadata, Viewport } from 'next';
import AppLayout from './components/AppLayout';

export const viewport: Viewport = {
  themeColor:    '#10B981',
  width:         'device-width',
  initialScale:  1,
  maximumScale:  1,
  viewportFit:   'cover',
};

export const metadata: Metadata = {
  title:       'MentHabit',
  description: 'Tu compañero de hábitos financieros.',
  manifest:    '/manifest.json',
  appleWebApp: {
    capable:         true,
    statusBarStyle:  'default',
    title:           'MentHabit',
  },
  icons: {
    apple: [
      { url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
    ],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body>
        <AppLayout>
          {children}
        </AppLayout>
      </body>
    </html>
  );
}
