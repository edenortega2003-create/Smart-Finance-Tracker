'use client';

import { useState } from 'react';
import { useStore } from '../../store/useStore';
import { Transaction } from '../../types';

import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TextField,
  Button,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
  Typography,
  Box,
  useMediaQuery,
  useTheme,
  Modal,
  TablePagination,
} from '@mui/material';

import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import { Plus, SlidersHorizontal, Eye, Pencil, Trash2 } from 'lucide-react';
import { useTranslation } from '../../hooks/useTranslation';
import TransactionModal from '../../components/TransactionModal';
import TransactionDetailsModal from '../../components/TransactionDetailsModal';
import { Button as AppButton } from '../../components/ui/Button';
import { getClassificationLabel, getRegularityLabel } from '../../utils/classifySuggestion';

/* ─── Desktop-only MUI button styles (unchanged) ───────────────────── */
const iosButtonStyle = {
  borderRadius: 3,
  textTransform: 'none' as const,
  fontWeight: 600,
  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
  background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.3) 0%, rgba(255, 255, 255, 0.1) 100%)',
  backdropFilter: 'blur(20px)',
  border: '1px solid rgba(255, 255, 255, 0.3)',
  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1), 0 2px 8px rgba(0, 0, 0, 0.1)',
  color: 'rgba(0, 0, 0, 0.8)',
  '&:hover': {
    background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.4) 0%, rgba(255, 255, 255, 0.2) 100%)',
    boxShadow: '0 12px 40px rgba(0, 0, 0, 0.15), 0 4px 12px rgba(0, 0, 0, 0.1)',
    transform: 'translateY(-1px)',
  },
  '&:active': {
    transform: 'translateY(0px)',
    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1), 0 1px 4px rgba(0, 0, 0, 0.1)',
  },
};

const iosButtonStyleSmall = {
  ...iosButtonStyle,
  py: 0.5,
  px: 1.5,
  fontSize: '14px',
  minWidth: 'auto',
};

const iosButtonStyleError = {
  ...iosButtonStyle,
  background: 'linear-gradient(135deg, rgba(255, 59, 48, 0.3) 0%, rgba(255, 59, 48, 0.1) 100%)',
  border: '1px solid rgba(255, 59, 48, 0.3)',
  color: 'rgba(255, 59, 48, 0.9)',
  '&:hover': {
    background: 'linear-gradient(135deg, rgba(255, 59, 48, 0.4) 0%, rgba(255, 59, 48, 0.2) 100%)',
    boxShadow: '0 12px 40px rgba(255, 59, 48, 0.15), 0 4px 12px rgba(255, 59, 48, 0.1)',
    transform: 'translateY(-1px)',
  },
};

const iosButtonStyleSecondary = {
  ...iosButtonStyle,
  background: 'linear-gradient(135deg, rgba(0, 122, 255, 0.3) 0%, rgba(0, 122, 255, 0.1) 100%)',
  border: '1px solid rgba(0, 122, 255, 0.3)',
  color: 'rgba(0, 122, 255, 0.9)',
  '&:hover': {
    background: 'linear-gradient(135deg, rgba(0, 122, 255, 0.4) 0%, rgba(0, 122, 255, 0.2) 100%)',
    boxShadow: '0 12px 40px rgba(0, 122, 255, 0.15), 0 4px 12px rgba(0, 122, 255, 0.1)',
    transform: 'translateY(-1px)',
  },
};

/* ─── Mobile helpers ────────────────────────────────────────────────── */
function formatDateLabel(dateStr: string): string {
  const today     = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  // Use noon to avoid timezone boundary issues with YYYY-MM-DD strings
  const tx = new Date(dateStr + 'T12:00:00');

  const sameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth()    === b.getMonth()    &&
    a.getDate()     === b.getDate();

  if (sameDay(tx, today))     return 'Hoy';
  if (sameDay(tx, yesterday)) return 'Ayer';

  return tx.toLocaleDateString('es-MX', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
}

function groupByDate(txs: Transaction[]): { label: string; items: Transaction[] }[] {
  const groups: { label: string; items: Transaction[] }[] = [];
  let current = '';
  for (const tx of txs) {
    const label = formatDateLabel(tx.date);
    if (label !== current) {
      groups.push({ label, items: [] });
      current = label;
    }
    groups[groups.length - 1].items.push(tx);
  }
  return groups;
}

const clsColorMap: Record<string, { bg: string; color: string }> = {
  hormiga:    { bg: '#FFF7ED', color: '#C2410C' },
  fijo:       { bg: '#EFF6FF', color: '#1D4ED8' },
  variable:   { bg: '#F0FDF4', color: '#15803D' },
  esporadico: { bg: '#FAF5FF', color: '#7C3AED' },
  inversion:  { bg: '#FFFBEB', color: '#B45309' },
  deuda:      { bg: '#FFF1F2', color: '#BE123C' },
  ahorro:     { bg: '#DCFCE7', color: '#166534' },
  otro:       { bg: '#F1F5F9', color: '#475569' },
  sueldo:     { bg: '#F0FDF4', color: '#15803D' },
  venta:      { bg: '#EFF6FF', color: '#1D4ED8' },
  regalo:     { bg: '#FFF7ED', color: '#C2410C' },
  reembolso:  { bg: '#F5F3FF', color: '#6D28D9' },
};

function clsBadgeStyle(cls: string) {
  return clsColorMap[cls] ?? { bg: '#F1F5F9', color: '#475569' };
}

/* ─── Mobile transaction card ───────────────────────────────────────── */
function TxCard({
  tx, currencySymbol, onView, onEdit, onDelete,
}: {
  tx: Transaction;
  currencySymbol: string;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const isIncome   = tx.type === 'income';
  const amountColor = isIncome ? '#059669' : '#E11D48';
  const dotColor    = isIncome ? '#22C55E' : '#EF4444';
  const amountText  = `${isIncome ? '+' : '−'} ${currencySymbol} ${tx.amount.toFixed(2)}`;
  const clsStyle    = clsBadgeStyle(tx.classification ?? '');
  const clsLabel    = getClassificationLabel(tx.classification, tx.type);
  const regLabel    = getRegularityLabel(tx.regularity);

  return (
    <div style={{
      background:   '#ffffff',
      borderRadius: '16px',
      border:       '1px solid rgba(0,0,0,0.06)',
      boxShadow:    '0 2px 8px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.04)',
      padding:      '14px 16px',
      display:      'flex',
      flexDirection:'column',
      gap:          '8px',
    }}>

      {/* Row 1: concept + amount */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        {/* type indicator dot */}
        <div style={{
          width: '8px', height: '8px', borderRadius: '50%',
          background: dotColor, flexShrink: 0,
          boxShadow: `0 0 0 3px ${dotColor}22`,
        }} />
        <span style={{
          flex: 1,
          fontSize: '14px',
          fontWeight: 600,
          color: '#111827',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          letterSpacing: '-0.01em',
        }}>
          {tx.concept ?? tx.category?.name ?? '—'}
        </span>
        <span style={{
          fontSize: '15px',
          fontWeight: 700,
          color: amountColor,
          fontVariantNumeric: 'tabular-nums',
          letterSpacing: '-0.02em',
          flexShrink: 0,
        }}>
          {amountText}
        </span>
      </div>

      {/* Row 2: badges + date */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', paddingLeft: '18px' }}>
        {/* classification badge */}
        <span style={{
          fontSize: '11px',
          fontWeight: 600,
          padding: '2px 8px',
          borderRadius: '999px',
          background: clsStyle.bg,
          color: clsStyle.color,
          letterSpacing: '0.01em',
        }}>
          {clsLabel}
        </span>

        {/* regularity badge */}
        <span style={{
          fontSize: '11px',
          fontWeight: 500,
          padding: '2px 8px',
          borderRadius: '999px',
          background: '#F8FAFC',
          color: '#64748B',
        }}>
          {regLabel}
        </span>

        {/* spacer */}
        <span style={{ flex: 1 }} />

        {/* date */}
        <span style={{
          fontSize: '11px',
          color: '#9CA3AF',
          fontVariantNumeric: 'tabular-nums',
          letterSpacing: '0.01em',
        }}>
          {new Date(tx.date + 'T12:00:00').toLocaleDateString('es-MX', {
            day: 'numeric', month: 'short',
          })}
        </span>
      </div>

      {/* Row 3: notes (optional, truncated) */}
      {tx.notes && (
        <p style={{
          margin: '0 0 0 18px',
          fontSize: '12px',
          color: '#9CA3AF',
          fontStyle: 'italic',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}>
          {tx.notes}
        </p>
      )}

      {/* Row 4: actions */}
      <div style={{
        display:        'flex',
        justifyContent: 'flex-end',
        alignItems:     'center',
        gap:            '6px',
        paddingTop:     '4px',
        borderTop:      '1px solid rgba(0,0,0,0.05)',
      }}>
        {/* Ver */}
        <button
          type="button"
          onClick={onView}
          aria-label="Ver detalle"
          style={{
            display:        'flex',
            alignItems:     'center',
            gap:            '4px',
            padding:        '5px 10px',
            borderRadius:   '8px',
            border:         '1px solid rgba(2,132,199,0.20)',
            background:     '#F0F9FF',
            color:          '#0284C7',
            fontSize:       '12px',
            fontWeight:     600,
            cursor:         'pointer',
          }}
        >
          <Eye size={12} />
          Ver
        </button>

        {/* Editar */}
        <button
          type="button"
          onClick={onEdit}
          aria-label="Editar transacción"
          style={{
            display:        'flex',
            alignItems:     'center',
            gap:            '4px',
            padding:        '5px 10px',
            borderRadius:   '8px',
            border:         '1px solid rgba(99,102,241,0.20)',
            background:     '#EEF2FF',
            color:          '#4F46E5',
            fontSize:       '12px',
            fontWeight:     600,
            cursor:         'pointer',
          }}
        >
          <Pencil size={12} />
          Editar
        </button>

        {/* Eliminar */}
        <button
          type="button"
          onClick={onDelete}
          aria-label="Eliminar transacción"
          style={{
            display:        'flex',
            alignItems:     'center',
            gap:            '4px',
            padding:        '5px 10px',
            borderRadius:   '8px',
            border:         '1px solid rgba(239,68,68,0.20)',
            background:     '#FFF1F2',
            color:          '#E11D48',
            fontSize:       '12px',
            fontWeight:     600,
            cursor:         'pointer',
          }}
        >
          <Trash2 size={12} />
          Eliminar
        </button>
      </div>
    </div>
  );
}

/* ─── Page ──────────────────────────────────────────────────────────── */
export default function TransactionsPage() {
  const { transactions, settings, deleteTransaction } = useStore();
  const [transactionToEdit, setTransactionToEdit]   = useState<Transaction | null>(null);
  const [transactionToDelete, setTransactionToDelete] = useState<Transaction | null>(null);
  const [transactionToView, setTransactionToView]   = useState<Transaction | null>(null);
  const [filterStartDate, setFilterStartDate]       = useState<string>('');
  const [filterEndDate, setFilterEndDate]           = useState<string>('');
  const [filterMonth, setFilterMonth]               = useState<string>('');
  const [filterYear, setFilterYear]                 = useState<string>('');
  const [isModalOpen, setIsModalOpen]               = useState(false);
  const [isFilterModalOpen, setIsFilterModalOpen]   = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen]   = useState(false);
  const [isViewModalOpen, setIsViewModalOpen]       = useState(false);
  const [page, setPage]                             = useState(0);
  const [rowsPerPage, setRowsPerPage]               = useState(20);

  const handleOpenModal = (transaction?: Transaction) => {
    setTransactionToEdit(transaction || null);
    setIsModalOpen(true);
  };
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setTransactionToEdit(null);
  };
  const handleOpenDeleteModal = (transaction: Transaction) => {
    setTransactionToDelete(transaction);
    setIsDeleteModalOpen(true);
  };
  const handleCloseDeleteModal = () => {
    setTransactionToDelete(null);
    setIsDeleteModalOpen(false);
  };
  const handleOpenViewModal = (transaction: Transaction) => {
    setTransactionToView(transaction);
    setIsViewModalOpen(true);
  };
  const handleCloseViewModal = () => {
    setIsViewModalOpen(false);
    setTransactionToView(null);
  };
  const handleOpenFilterModal  = () => setIsFilterModalOpen(true);
  const handleCloseFilterModal = () => setIsFilterModalOpen(false);

  const getCurrencySymbol = (currencyString: string) => {
    const parts = currencyString.split(' ');
    return parts[parts.length - 1];
  };
  const currencySymbol = getCurrencySymbol(settings.currency);

  const theme    = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { t, loading } = useTranslation();

  const [snackbarOpen, setSnackbarOpen]           = useState(false);
  const [snackbarMessage, setSnackbarMessage]     = useState('');
  const [snackbarSeverity, setSnackbarSeverity]   = useState<'success' | 'error' | 'info' | 'warning'>('success');

  const showSnackbar = (message: string, severity: 'success' | 'error' | 'info' | 'warning') => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };
  const handleSnackbarClose = () => setSnackbarOpen(false);

  const handleDeleteTransaction = () => {
    if (transactionToDelete) {
      deleteTransaction(transactionToDelete.id);
      handleCloseDeleteModal();
      showSnackbar(t.transaction_deleted_successfully, 'success');
    }
  };

  const sortedTransactions = transactions.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const filteredTransactions = sortedTransactions.filter(transaction => {
    const transactionDate = new Date(transaction.date);
    if (filterStartDate && filterEndDate) {
      const start = new Date(filterStartDate);
      const end   = new Date(filterEndDate);
      if (transactionDate < start || transactionDate > end) return false;
    }
    if (filterMonth) {
      const monthIndex = parseInt(filterMonth, 10) - 1;
      if (transactionDate.getMonth() !== monthIndex) return false;
    }
    if (filterYear) {
      if (transactionDate.getFullYear().toString() !== filterYear) return false;
    }
    return true;
  });

  const handleChangePage = (event: unknown, newPage: number) => setPage(newPage);
  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const totalPages          = Math.ceil(filteredTransactions.length / rowsPerPage);
  const paginatedTransactions = filteredTransactions.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  const years  = Array.from(new Set(transactions.map(t => new Date(t.date).getFullYear().toString()))).sort();
  const months = [
    { value: '1',  label: 'January'   },
    { value: '2',  label: 'February'  },
    { value: '3',  label: 'March'     },
    { value: '4',  label: 'April'     },
    { value: '5',  label: 'May'       },
    { value: '6',  label: 'June'      },
    { value: '7',  label: 'July'      },
    { value: '8',  label: 'August'    },
    { value: '9',  label: 'September' },
    { value: '10', label: 'October'   },
    { value: '11', label: 'November'  },
    { value: '12', label: 'December'  },
  ];

  if (loading) {
    return <Typography>{t.loading_translations}</Typography>;
  }

  /* ── Mobile date groups ─────────────────────────────────────────── */
  const dateGroups = groupByDate(paginatedTransactions);

  return (
    <>
      <Box sx={{ pt: 1 }}>

        {/* ── Header ──────────────────────────────────────────────── */}
        <div className="flex items-center justify-between mb-5">
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
            {t.transactions}
          </h1>
          <div className="flex items-center gap-2">
            <Button
              variant="outlined"
              size="small"
              onClick={handleOpenFilterModal}
              sx={{
                textTransform: 'none',
                borderRadius:  '8px',
                borderColor:   'rgba(0,0,0,0.12)',
                color:         'rgba(0,0,0,0.6)',
                '&:hover': { borderColor: 'rgba(0,0,0,0.25)', background: 'rgba(0,0,0,0.04)' },
              }}
            >
              <SlidersHorizontal size={14} style={{ marginRight: 6 }} />
              {t.filter_transactions}
            </Button>
            <AppButton variant="primary" size="sm" onClick={() => handleOpenModal()}>
              <Plus size={14} aria-hidden="true" />
              {t.add_new_transaction}
            </AppButton>
          </div>
        </div>

        {/* ── Filter modal (unchanged) ─────────────────────────────── */}
        <Modal
          open={isFilterModalOpen}
          onClose={handleCloseFilterModal}
          aria-labelledby="filter-modal-title"
          BackdropProps={{
            sx: { backgroundColor: 'rgba(0, 0, 0, 0.2)', backdropFilter: 'blur(4px)' }
          }}
        >
          <Box sx={{
            position: 'absolute', top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
            width: isMobile ? '90%' : 400,
            backgroundColor: 'rgba(255, 255, 255, 0.2)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            boxShadow: '0 16px 48px rgba(0, 0, 0, 0.4)',
            borderRadius: 2, p: 4,
          }}>
            <Typography id="filter-modal-title" variant="h6" component="h2" gutterBottom>
              {t.filter_transactions}
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField fullWidth type="date" label={t.start_date}
                value={filterStartDate} onChange={(e) => setFilterStartDate(e.target.value)}
                InputLabelProps={{ shrink: true }} />
              <TextField fullWidth type="date" label={t.end_date}
                value={filterEndDate} onChange={(e) => setFilterEndDate(e.target.value)}
                InputLabelProps={{ shrink: true }} />
              <FormControl fullWidth>
                <InputLabel>{t.month}</InputLabel>
                <Select value={filterMonth} onChange={(e) => setFilterMonth(e.target.value)} label={t.month}>
                  <MenuItem value="">{t.all}</MenuItem>
                  {months.map(m => (
                    <MenuItem key={m.value} value={m.value}>
                      {t[m.label.toLowerCase() as keyof typeof t]}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl fullWidth>
                <InputLabel>{t.year}</InputLabel>
                <Select value={filterYear} onChange={(e) => setFilterYear(e.target.value)} label={t.year}>
                  <MenuItem value="">{t.all}</MenuItem>
                  {years.map(y => <MenuItem key={y} value={y}>{y}</MenuItem>)}
                </Select>
              </FormControl>
              <Button variant="contained" onClick={handleCloseFilterModal} sx={iosButtonStyleSecondary}>
                {t.apply_filters}
              </Button>
              <Button variant="outlined" onClick={() => {
                setFilterStartDate(''); setFilterEndDate('');
                setFilterMonth('');    setFilterYear('');
              }} sx={iosButtonStyleError}>
                {t.clear_filters}
              </Button>
            </Box>
          </Box>
        </Modal>

        {/* ── Mobile card list ─────────────────────────────────────── */}
        {isMobile ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>

            {/* Empty state */}
            {filteredTransactions.length === 0 && (
              <div style={{
                textAlign:  'center',
                padding:    '48px 24px',
                background: '#ffffff',
                borderRadius:'16px',
                border:     '1px solid rgba(0,0,0,0.06)',
              }}>
                <div style={{ fontSize: '40px', marginBottom: '12px' }}>💸</div>
                <p style={{ fontSize: '16px', fontWeight: 600, color: '#111827', margin: '0 0 6px' }}>
                  Sin movimientos
                </p>
                <p style={{ fontSize: '14px', color: '#9CA3AF', margin: 0 }}>
                  Registra tu primer gasto para verlo aquí.
                </p>
              </div>
            )}

            {/* Date groups */}
            {dateGroups.map(group => (
              <div key={group.label} style={{ marginBottom: '8px' }}>

                {/* Date section header */}
                <div style={{
                  display:     'flex',
                  alignItems:  'center',
                  gap:         '8px',
                  padding:     '12px 4px 8px',
                }}>
                  <span style={{
                    fontSize:     '11px',
                    fontWeight:   700,
                    color:        '#9CA3AF',
                    letterSpacing:'0.08em',
                    textTransform:'uppercase',
                  }}>
                    {group.label}
                  </span>
                  <div style={{
                    flex:       1,
                    height:     '1px',
                    background: 'rgba(0,0,0,0.07)',
                  }} />
                  {/* group total */}
                  <span style={{
                    fontSize:    '11px',
                    fontWeight:  600,
                    color:       '#9CA3AF',
                    fontVariantNumeric: 'tabular-nums',
                  }}>
                    {group.items.length} {group.items.length === 1 ? 'mov.' : 'movs.'}
                  </span>
                </div>

                {/* Cards */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {group.items.map(tx => (
                    <TxCard
                      key={tx.id}
                      tx={tx}
                      currencySymbol={currencySymbol}
                      onView={()   => handleOpenViewModal(tx)}
                      onEdit={()   => handleOpenModal(tx)}
                      onDelete={()  => handleOpenDeleteModal(tx)}
                    />
                  ))}
                </div>
              </div>
            ))}

            {/* Mobile pagination */}
            {filteredTransactions.length > rowsPerPage && (
              <div style={{
                display:        'flex',
                alignItems:     'center',
                justifyContent: 'space-between',
                padding:        '16px 4px 8px',
                gap:            '12px',
              }}>
                <button
                  type="button"
                  disabled={page === 0}
                  onClick={() => setPage(p => Math.max(0, p - 1))}
                  style={{
                    padding:      '8px 16px',
                    borderRadius: '10px',
                    border:       '1px solid rgba(0,0,0,0.10)',
                    background:   page === 0 ? '#F9FAFB' : '#ffffff',
                    color:        page === 0 ? '#9CA3AF' : '#374151',
                    fontSize:     '13px',
                    fontWeight:   600,
                    cursor:       page === 0 ? 'not-allowed' : 'pointer',
                  }}
                >
                  ← Anterior
                </button>

                <span style={{ fontSize: '12px', color: '#9CA3AF', fontVariantNumeric: 'tabular-nums' }}>
                  {page + 1} / {totalPages}
                </span>

                <button
                  type="button"
                  disabled={page >= totalPages - 1}
                  onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                  style={{
                    padding:      '8px 16px',
                    borderRadius: '10px',
                    border:       '1px solid rgba(0,0,0,0.10)',
                    background:   page >= totalPages - 1 ? '#F9FAFB' : '#ffffff',
                    color:        page >= totalPages - 1 ? '#9CA3AF' : '#374151',
                    fontSize:     '13px',
                    fontWeight:   600,
                    cursor:       page >= totalPages - 1 ? 'not-allowed' : 'pointer',
                  }}
                >
                  Siguiente →
                </button>
              </div>
            )}
          </div>

        ) : (
          /* ── Desktop table (unchanged) ──────────────────────────── */
          <Paper>
            <TableContainer component={Paper}>
              <Table sx={{ minWidth: 650 }} aria-label="transactions table">
                <TableHead>
                  <TableRow>
                    <TableCell>{t.date}</TableCell>
                    <TableCell>Concepto</TableCell>
                    <TableCell>Clasificación</TableCell>
                    <TableCell>Regularidad</TableCell>
                    <TableCell align="right">{t.amount}</TableCell>
                    <TableCell>{t.type}</TableCell>
                    <TableCell>{t.actions}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedTransactions.map((transaction) => (
                    <TableRow
                      key={transaction.id}
                      sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                    >
                      <TableCell component="th" scope="row">
                        {new Date(transaction.date).toLocaleDateString()}
                      </TableCell>
                      <TableCell sx={{ fontWeight: 500 }}>
                        {transaction.concept ?? transaction.category?.name ?? '—'}
                      </TableCell>
                      <TableCell>
                        {getClassificationLabel(transaction.classification, transaction.type)}
                      </TableCell>
                      <TableCell>
                        {getRegularityLabel(transaction.regularity)}
                      </TableCell>
                      <TableCell
                        align="right"
                        sx={{ color: transaction.type === 'income' ? 'green' : 'red' }}
                      >
                        {transaction.type === 'income' ? '+' : '-'} {currencySymbol}{' '}
                        {transaction.amount.toFixed(2)}
                      </TableCell>
                      <TableCell sx={{ textTransform: 'capitalize' }}>
                        {transaction.type}
                      </TableCell>
                      <TableCell>
                        <Button
                          size="small"
                          variant="contained"
                          startIcon={<Eye size={14} />}
                          onClick={() => handleOpenViewModal(transaction)}
                          sx={{ ...iosButtonStyleSecondary, mr: 1 }}
                        >
                          {t.view}
                        </Button>
                        <Button
                          size="small"
                          variant="contained"
                          onClick={() => handleOpenModal(transaction)}
                          sx={{ ...iosButtonStyleSmall, mr: 1 }}
                        >
                          {t.edit}
                        </Button>
                        <Button
                          size="small"
                          variant="contained"
                          onClick={() => handleOpenDeleteModal(transaction)}
                          sx={iosButtonStyleError}
                        >
                          {t.delete}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              rowsPerPageOptions={[20, 50, 100, 200]}
              component="div"
              count={filteredTransactions.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
            />
          </Paper>
        )}

        {/* ── Transaction edit modal ───────────────────────────────── */}
        {isModalOpen && (
          <TransactionModal
            open={isModalOpen}
            onClose={handleCloseModal}
            transaction={transactionToEdit}
            showSnackbar={showSnackbar}
          />
        )}

        {/* ── Delete confirmation modal ────────────────────────────── */}
        <Modal
          open={isDeleteModalOpen}
          onClose={handleCloseDeleteModal}
          aria-labelledby="delete-transaction-modal-title"
          BackdropProps={{
            sx: { backgroundColor: 'rgba(0, 0, 0, 0.2)', backdropFilter: 'blur(4px)' }
          }}
        >
          <Box sx={{
            position: 'absolute', top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
            width: isMobile ? '90%' : 400,
            backgroundColor: 'rgba(255, 255, 255, 0.2)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            boxShadow: '0 16px 48px rgba(0, 0, 0, 0.4)',
            borderRadius: 2, p: 4,
          }}>
            <Typography id="delete-transaction-modal-title" variant="h6" component="h2" gutterBottom>
              {t.delete_transaction}
            </Typography>
            <Typography sx={{ mb: 2 }}>
              {t.are_you_sure_you_want_to_delete_this_transaction}
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
              <Button variant="outlined" onClick={handleCloseDeleteModal} sx={iosButtonStyle}>
                {t.cancel}
              </Button>
              <Button variant="contained" onClick={handleDeleteTransaction} sx={iosButtonStyleError}>
                {t.delete}
              </Button>
            </Box>
          </Box>
        </Modal>

        {/* ── Transaction details modal ────────────────────────────── */}
        <TransactionDetailsModal
          open={isViewModalOpen}
          onClose={handleCloseViewModal}
          transaction={transactionToView}
        />

      </Box>

      <Snackbar open={snackbarOpen} autoHideDuration={6000} onClose={handleSnackbarClose}>
        <Alert onClose={handleSnackbarClose} severity={snackbarSeverity} sx={{ width: '100%' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </>
  );
}
