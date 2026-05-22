'use client';

import Link from 'next/link';
import {
  AppBar,
  Toolbar,
  Container,
  useMediaQuery,
  useTheme,
  Box,
  Snackbar,
  Alert,
  Typography,
} from '@mui/material';
import { Plus, TrendingDown, TrendingUp, LayoutGrid, Home, ArrowLeftRight, Tag, Settings, X, LogOut } from 'lucide-react';
import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useUser } from '../hooks/useUser';
import { createClient } from '@/lib/supabase/client';
import { useTranslation } from '../hooks/useTranslation';
import { useCloudSync } from '../hooks/useCloudSync';
import TransactionModal from './TransactionModal';
import GlobalLoader from './GlobalLoader';
import Sidebar, { DRAWER_WIDTH } from './Sidebar';
import { Transaction } from '../types';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { t } = useTranslation();
  const pathname = usePathname();
  const router = useRouter();
  const user = useUser();
  const [menuOpen, setMenuOpen] = useState(false);

  useCloudSync(); // hydrates from Supabase on login, syncs actions fire-and-forget

  const getPageTitle = () => {
    if (pathname === '/')                    return t.home || 'Dashboard';
    if (pathname === '/registro')            return 'Registro rápido';
    if (pathname === '/ingresos')            return 'Ingresos';
    if (pathname.startsWith('/categories'))  return t.categories || 'Hábitos';
    if (pathname.startsWith('/transactions')) return t.transactions || 'Movimientos';
    if (pathname.startsWith('/settings'))    return t.settings || 'Ajustes';
    return t.expense_tracker || 'MentHabit';
  };

  const [modalOpen, setModalOpen]         = useState(false);
  const [transaction, setTransaction]     = useState<Omit<Transaction, 'id'> | null>(null);
  const [snackbarOpen, setSnackbarOpen]   = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error' | 'info' | 'warning'>('success');

  /* Close menu when route changes */
  useEffect(() => { setMenuOpen(false); }, [pathname]);

  const showSnackbar = (message: string, severity: 'success' | 'error' | 'info' | 'warning') => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };
  const handleSnackbarClose = () => setSnackbarOpen(false);
  const handleModalOpen  = () => { setTransaction(null); setModalOpen(true);  };
  const handleModalClose = () => setModalOpen(false);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
  };

  /* True when the current page lives in the secondary menu */
  const isSecondaryPage =
    pathname === '/' ||
    pathname.startsWith('/transactions') ||
    pathname.startsWith('/categories') ||
    pathname.startsWith('/settings');

  return (
    <>
      <Box sx={{
        display: 'flex',
        minHeight: '100vh',
        background: 'linear-gradient(145deg, #FFF9E6 0%, #FFFDF7 55%, #F0FDFA 100%)',
      }}>
        {/* Desktop Sidebar — hidden on mobile via CSS (SSR-safe, no layout shift) */}
        <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
          <Sidebar />
        </Box>

        {/* Main Content Area */}
        <Box component="main" sx={{
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          minHeight: '100vh',
          minWidth: 0,
          overflow: 'hidden',
          marginLeft: { xs: 0, sm: `${DRAWER_WIDTH}px` },
        }}>
          {/* iOS-style AppBar (mobile only) */}
          {isMobile && (
            <AppBar position="static" sx={{
              backgroundColor: 'rgba(255,255,255,0.05) !important',
              backdropFilter: 'blur(25px) saturate(200%)',
              WebkitBackdropFilter: 'blur(25px) saturate(200%)',
              borderBottom: '0.5px solid rgba(255,255,255,0.15)',
              boxShadow: 'none',
              color: 'rgba(0,0,0,0.9)',
              background: 'linear-gradient(135deg,rgba(255,255,255,0.08) 0%,rgba(255,255,255,0.02) 100%)',
              border: '1px solid rgba(255,255,255,0.18)',
            }}>
              <Toolbar sx={{
                minHeight: '44px !important',
                height: '44px',
                paddingTop: 'env(safe-area-inset-top,0px)',
                paddingX: 2,
                justifyContent: 'center',
                position: 'relative',
              }}>
                <Typography variant="h6" component="h1" sx={{
                  fontWeight: 600,
                  fontSize: '17px',
                  lineHeight: '22px',
                  color: 'rgba(0,0,0,0.9)',
                  textAlign: 'center',
                  letterSpacing: '-0.41px',
                  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif',
                  textShadow: '0 1px 3px rgba(255,255,255,0.9), 0 0 10px rgba(255,255,255,0.5)',
                }}>
                  {getPageTitle()}
                </Typography>
              </Toolbar>
            </AppBar>
          )}

          {/* Page content */}
          <Container sx={{ pb: isMobile ? '80px' : 2, pt: 2, flexGrow: 1 }}>
            {children}
          </Container>
        </Box>
      </Box>

      {/* ── Mobile navigation (rendered outside the flex layout to avoid overflow) ── */}
      {isMobile && (
        <>
          {/* ── Bottom bar: 3 primary tabs ────────────────────────────────── */}
          <div style={{
            position: 'fixed',
            bottom: 0, left: 0, right: 0,
            zIndex: 1000,
            height: '66px',
            display: 'flex',
            alignItems: 'stretch',
            background: 'rgba(255,255,255,0.92)',
            backdropFilter: 'blur(28px) saturate(180%)',
            WebkitBackdropFilter: 'blur(28px) saturate(180%)',
            borderTop: '1px solid rgba(0,0,0,0.06)',
            boxShadow: '0 -2px 16px rgba(0,0,0,0.04)',
            paddingBottom: 'env(safe-area-inset-bottom,0px)',
          }}>

            {/* Gasto → /registro */}
            <Link href="/registro" style={{
              flex: 1,
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              gap: '3px',
              textDecoration: 'none',
              color: pathname === '/registro' ? '#E11D48' : '#A1A1AA',
              borderTop: pathname === '/registro'
                ? '2px solid #E11D48'
                : '2px solid transparent',
              transition: 'color 150ms ease, border-color 150ms ease',
              paddingTop: '10px',
            }}>
              <TrendingDown size={21} strokeWidth={pathname === '/registro' ? 2 : 1.5} />
              <span style={{
                fontSize: '10px',
                fontWeight: pathname === '/registro' ? 700 : 500,
                letterSpacing: '0.02em',
              }}>Gasto</span>
            </Link>

            {/* Ingreso → /ingresos */}
            <Link href="/ingresos" style={{
              flex: 1,
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              gap: '3px',
              textDecoration: 'none',
              color: pathname === '/ingresos' ? '#059669' : '#A1A1AA',
              borderTop: pathname === '/ingresos'
                ? '2px solid #059669'
                : '2px solid transparent',
              transition: 'color 150ms ease, border-color 150ms ease',
              paddingTop: '10px',
            }}>
              <TrendingUp size={21} strokeWidth={pathname === '/ingresos' ? 2 : 1.5} />
              <span style={{
                fontSize: '10px',
                fontWeight: pathname === '/ingresos' ? 700 : 500,
                letterSpacing: '0.02em',
              }}>Ingreso</span>
            </Link>

            {/* Menú → bottom sheet */}
            <button
              type="button"
              onClick={() => setMenuOpen(prev => !prev)}
              style={{
                flex: 1,
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                gap: '3px',
                background: 'none', border: 'none',
                borderTop: (menuOpen || isSecondaryPage)
                  ? '2px solid #6366F1'
                  : '2px solid transparent',
                cursor: 'pointer',
                color: (menuOpen || isSecondaryPage) ? '#6366F1' : '#A1A1AA',
                transition: 'color 150ms ease, border-color 150ms ease',
                paddingTop: '10px',
              }}
            >
              <LayoutGrid size={21} strokeWidth={(menuOpen || isSecondaryPage) ? 2 : 1.5} />
              <span style={{
                fontSize: '10px',
                fontWeight: (menuOpen || isSecondaryPage) ? 700 : 500,
                letterSpacing: '0.02em',
              }}>Menú</span>
            </button>
          </div>

          {/* ── Backdrop ──────────────────────────────────────────────────── */}
          <div
            role="presentation"
            onClick={() => setMenuOpen(false)}
            style={{
              position: 'fixed', inset: 0,
              zIndex: 1100,
              background: 'rgba(0,0,0,0.32)',
              backdropFilter: 'blur(4px)',
              WebkitBackdropFilter: 'blur(4px)',
              opacity: menuOpen ? 1 : 0,
              pointerEvents: menuOpen ? 'auto' : 'none',
              transition: 'opacity 250ms ease',
            }}
          />

          {/* ── Bottom sheet: secondary navigation ────────────────────────── */}
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Menú de navegación"
            style={{
              position: 'fixed',
              bottom: 0, left: 0, right: 0,
              zIndex: 1200,
              background: '#ffffff',
              borderRadius: '24px 24px 0 0',
              boxShadow: '0 -8px 40px rgba(0,0,0,0.15), 0 -2px 8px rgba(0,0,0,0.06)',
              transform: menuOpen ? 'translateY(0)' : 'translateY(100%)',
              transition: 'transform 320ms cubic-bezier(0.34, 1.56, 0.64, 1)',
              paddingBottom: 'env(safe-area-inset-bottom,0px)',
            }}
          >
            {/* Handle bar */}
            <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '12px', paddingBottom: '2px' }}>
              <div style={{ width: '36px', height: '4px', borderRadius: '2px', background: 'rgba(0,0,0,0.12)' }} />
            </div>

            {/* Sheet header */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '10px 20px 14px',
            }}>
              <span style={{ fontSize: '17px', fontWeight: 700, color: '#111827', letterSpacing: '-0.02em' }}>
                Navegar a
              </span>
              <button
                type="button"
                onClick={() => setMenuOpen(false)}
                aria-label="Cerrar menú"
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  width: '32px', height: '32px',
                  borderRadius: '50%',
                  border: 'none',
                  background: 'rgba(0,0,0,0.06)',
                  color: '#6B7280',
                  cursor: 'pointer',
                  padding: 0,
                }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Nav items */}
            <nav aria-label="Navegación secundaria" style={{ padding: '0 12px 8px' }}>
              {[
                {
                  href: '/',
                  icon: <Home size={20} />,
                  label: 'Home',
                  sublabel: 'Panel principal',
                  color: '#6366F1',
                  active: pathname === '/',
                },
                {
                  href: '/transactions',
                  icon: <ArrowLeftRight size={20} />,
                  label: 'Movimientos',
                  sublabel: 'Historial de transacciones',
                  color: '#3B82F6',
                  active: pathname.startsWith('/transactions'),
                },
                {
                  href: '/categories',
                  icon: <Tag size={20} />,
                  label: 'Hábitos',
                  sublabel: 'Categorías y hábitos financieros',
                  color: '#8B5CF6',
                  active: pathname.startsWith('/categories'),
                },
                {
                  href: '/settings',
                  icon: <Settings size={20} />,
                  label: 'Ajustes',
                  sublabel: 'Configuración y datos',
                  color: '#6B7280',
                  active: pathname.startsWith('/settings'),
                },
              ].map(item => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMenuOpen(false)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '14px',
                    padding: '12px 14px',
                    borderRadius: '16px',
                    textDecoration: 'none',
                    marginBottom: '4px',
                    background: item.active ? `${item.color}12` : 'transparent',
                  }}
                >
                  {/* Icon container */}
                  <span style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    width: '44px', height: '44px',
                    borderRadius: '14px',
                    background: item.active ? `${item.color}22` : 'rgba(0,0,0,0.05)',
                    color: item.active ? item.color : '#6B7280',
                    flexShrink: 0,
                  }}>
                    {item.icon}
                  </span>

                  {/* Label + sublabel */}
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={{
                      display: 'block',
                      fontSize: '15px',
                      fontWeight: item.active ? 700 : 500,
                      color: item.active ? item.color : '#111827',
                      letterSpacing: '-0.01em',
                    }}>
                      {item.label}
                    </span>
                    <span style={{
                      display: 'block',
                      fontSize: '12px',
                      color: '#9CA3AF',
                      marginTop: '1px',
                    }}>
                      {item.sublabel}
                    </span>
                  </span>

                  {/* Active dot */}
                  {item.active && (
                    <span style={{
                      width: '8px', height: '8px',
                      borderRadius: '50%',
                      background: item.color,
                      flexShrink: 0,
                    }} />
                  )}
                </Link>
              ))}

              {/* ── Logout ── */}
              <div style={{ height: '1px', background: 'rgba(0,0,0,0.06)', margin: '8px 14px 8px' }} />
              <button
                type="button"
                onClick={handleLogout}
                style={{
                  display:    'flex',
                  alignItems: 'center',
                  gap:        '14px',
                  padding:    '12px 14px',
                  borderRadius: '16px',
                  width:      '100%',
                  border:     'none',
                  background: 'transparent',
                  cursor:     'pointer',
                  textAlign:  'left',
                }}
              >
                <span style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  width: '44px', height: '44px',
                  borderRadius: '14px',
                  background: 'rgba(239,68,68,0.08)',
                  color: '#EF4444',
                  flexShrink: 0,
                }}>
                  <LogOut size={20} />
                </span>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: 'block', fontSize: '15px', fontWeight: 500, color: '#EF4444', letterSpacing: '-0.01em' }}>
                    Cerrar sesión
                  </span>
                  {user?.email && (
                    <span style={{ display: 'block', fontSize: '12px', color: '#9CA3AF', marginTop: '1px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {user.email}
                    </span>
                  )}
                </span>
              </button>
            </nav>
          </div>
        </>
      )}

      {/* ── Global FAB (quick-add transaction) ── */}
      <button
        type="button"
        onClick={handleModalOpen}
        aria-label="Agregar transacción"
        style={{ bottom: isMobile ? '88px' : '24px' }}
        className="fixed right-4 z-[1050] flex items-center justify-center w-14 h-14 rounded-full bg-indigo-500 text-white shadow-[0_8px_32px_rgba(99,102,241,0.40)] hover:bg-indigo-600 active:scale-95 transition-all duration-[100ms] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
      >
        <Plus size={24} aria-hidden="true" />
      </button>

      {modalOpen && (
        <TransactionModal
          open={modalOpen}
          onClose={handleModalClose}
          transaction={transaction}
          showSnackbar={showSnackbar}
        />
      )}
      <Snackbar open={snackbarOpen} autoHideDuration={6000} onClose={handleSnackbarClose}>
        <Alert onClose={handleSnackbarClose} severity={snackbarSeverity} sx={{ width: '100%' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
      <GlobalLoader />
    </>
  );
}
