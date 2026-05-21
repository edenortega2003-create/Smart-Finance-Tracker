import AppLayout from '../components/AppLayout';

/**
 * Website layout — wraps all app pages (/, /registro, /ingresos, etc.)
 * with AppLayout (sidebar + mobile nav + FAB).
 * Auth pages at app/(auth)/ bypass this layout entirely.
 */
export default function WebsiteLayout({ children }: { children: React.ReactNode }) {
  return <AppLayout>{children}</AppLayout>;
}
