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
  BottomNavigation,
  BottomNavigationAction,
  Paper,
  Typography,
} from '@mui/material';
import { Plus } from 'lucide-react';
import HomeIcon from '@mui/icons-material/Home';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import SettingsIcon from '@mui/icons-material/Settings';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useTranslation } from '../hooks/useTranslation';
import TransactionModal from './TransactionModal';
import GlobalLoader from './GlobalLoader';
import Sidebar, { DRAWER_WIDTH } from './Sidebar';
import { Transaction } from '../types';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { t } = useTranslation();
  const pathname = usePathname();
  const [bottomNavValue, setBottomNavValue] = useState(0);

  // Get page title based on current route
  const getPageTitle = () => {
    if (pathname === '/') {
      return t.home || 'Dashboard';
    } else if (pathname === '/registro') {
      return 'Registro rápido';
    } else if (pathname === '/ingresos') {
      return 'Ingresos';
    } else if (pathname === '/categories') {
      return t.categories || 'Categories';
    } else if (pathname === '/transactions') {
      return t.transactions || 'Transactions';
    } else if (pathname.startsWith('/settings')) {
      return t.settings || 'Settings';
    } else {
      return t.expense_tracker || 'MentHabit';
    }
  };

  const [modalOpen, setModalOpen] = useState(false);
  const [transaction, setTransaction] = useState<Omit<Transaction, 'id'> | null>(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error' | 'info' | 'warning'>('success');

  // Update bottom navigation value based on current route
  // Order: Home(0) | Transactions(1) | Registro(2-center) | Categories(3) | Settings(4)
  useEffect(() => {
    if (pathname === '/') {
      setBottomNavValue(0);
    } else if (pathname.startsWith('/transactions')) {
      setBottomNavValue(1);
    } else if (pathname === '/registro') {
      setBottomNavValue(2);
    } else if (pathname === '/ingresos') {
      setBottomNavValue(3);
    } else if (pathname.startsWith('/settings')) {
      setBottomNavValue(4);
    } else {
      setBottomNavValue(0);
    }
  }, [pathname]);

  const showSnackbar = (message: string, severity: 'success' | 'error' | 'info' | 'warning') => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  const handleModalOpen = () => {
    setTransaction(null);
    setModalOpen(true);
  };

  const handleModalClose = () => {
    setModalOpen(false);
  };

  return (
    <>
      <Box
        sx={{
          display: 'flex',
          minHeight: '100vh',
          background: 'linear-gradient(145deg, #FFF9E6 0%, #FFFDF7 55%, #F0FDFA 100%)',
        }}
      >
        {/* Desktop Sidebar */}
        {!isMobile && <Sidebar />}

        {/* Main Content Area */}
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            display: 'flex',
            flexDirection: 'column',
            minHeight: '100vh',
            marginLeft: isMobile ? 0 : `${DRAWER_WIDTH}px`,
          }}
        >
          {/* iOS-style AppBar for mobile */}
          {isMobile && (
            <AppBar
              position="static"
              sx={{
                backgroundColor: 'rgba(255, 255, 255, 0.05) !important',
                backdropFilter: 'blur(25px) saturate(200%)',
                WebkitBackdropFilter: 'blur(25px) saturate(200%)',
                borderBottom: '0.5px solid rgba(255, 255, 255, 0.15)',
                boxShadow: 'none',
                color: 'rgba(0, 0, 0, 0.9)',
                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.02) 100%)',
                border: '1px solid rgba(255, 255, 255, 0.18)',
              }}
            >
              <Toolbar
                sx={{
                  minHeight: '44px !important',
                  height: '44px',
                  paddingTop: 'env(safe-area-inset-top, 0px)',
                  paddingX: 2,
                  justifyContent: 'center',
                  position: 'relative',
                }}
              >
                <Typography
                  variant="h6"
                  component="h1"
                  sx={{
                    fontWeight: 600,
                    fontSize: '17px',
                    lineHeight: '22px',
                    color: 'rgba(0, 0, 0, 0.9)',
                    textAlign: 'center',
                    letterSpacing: '-0.41px',
                    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif',
                    textShadow: '0 1px 3px rgba(255, 255, 255, 0.9), 0 0 10px rgba(255, 255, 255, 0.5)',
                  }}
                >
                  {getPageTitle()}
                </Typography>
              </Toolbar>
            </AppBar>
          )}

          {/* Content Container */}
          <Container
            sx={{
              pb: isMobile ? '80px' : 2,
              pt: 2,
              flexGrow: 1,
            }}
          >
            {children}
          </Container>
        </Box>
      </Box>

      {/* Bottom Navigation for Mobile */}
      {isMobile && (
        <Paper
          sx={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 1000,
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
          }}
          elevation={0}
        >
          <BottomNavigation
            value={bottomNavValue}
            onChange={(event, newValue) => {
              setBottomNavValue(newValue);
            }}
            showLabels
            sx={{
              '& .MuiBottomNavigationAction-root': { minWidth: 0, padding: '4px 2px' },
              '& .MuiBottomNavigationAction-label': { fontSize: '10px !important', marginTop: '2px' },
              '& .Mui-selected .MuiBottomNavigationAction-label': { fontSize: '10px !important' },
            }}
          >
            {/* 0 — Home */}
            <BottomNavigationAction
              label={t.home || 'Home'}
              icon={<HomeIcon />}
              component={Link}
              href="/"
            />
            {/* 1 — Transactions */}
            <BottomNavigationAction
              label={t.transactions || 'Historial'}
              icon={<AccountBalanceWalletIcon />}
              component={Link}
              href="/transactions"
            />
            {/* 2 — Registro (center hero tab) */}
            <BottomNavigationAction
              label="Registro"
              component={Link}
              href="/registro"
              icon={
                <span style={{
                  display:        'flex',
                  alignItems:     'center',
                  justifyContent: 'center',
                  width:          '48px',
                  height:         '48px',
                  borderRadius:   '50%',
                  background:     bottomNavValue === 2
                    ? 'linear-gradient(135deg, #10B981 0%, #0EA5A0 100%)'
                    : 'linear-gradient(135deg, #10B981 0%, #14B8A6 100%)',
                  boxShadow:      bottomNavValue === 2
                    ? '0 6px 20px rgba(16,185,129,0.45)'
                    : '0 4px 14px rgba(16,185,129,0.32)',
                  marginBottom:   '-8px',
                  marginTop:      '-16px',
                  color:          '#ffffff',
                  transition:     'all 180ms ease',
                }}>
                  <AddCircleIcon sx={{ fontSize: '26px !important', color: '#ffffff' }} />
                </span>
              }
              sx={{
                '& .MuiBottomNavigationAction-label': {
                  color:      '#10B981 !important',
                  fontWeight: '700 !important',
                  marginTop:  '6px !important',
                },
              }}
            />
            {/* 3 — Ingresos */}
            <BottomNavigationAction
              label="Ingresos"
              icon={<TrendingUpIcon />}
              component={Link}
              href="/ingresos"
            />
            {/* 4 — Settings */}
            <BottomNavigationAction
              label={t.settings || 'Ajustes'}
              icon={<SettingsIcon />}
              component={Link}
              href="/settings"
            />
          </BottomNavigation>
        </Paper>
      )}

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
