/**
 * Auth layout — minimal wrapper. No AppLayout, no navigation, no sidebar.
 * Pages: /login, /signup
 */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
