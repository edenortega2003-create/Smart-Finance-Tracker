import './globals.css';
import AppLayout from './components/AppLayout';

export const metadata = {
  title: 'MentHabit',
  description: 'Tu compañero de hábitos financieros.',
  manifest: '/manifest.json',
  themeColor: '#10B981',
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
  )
}