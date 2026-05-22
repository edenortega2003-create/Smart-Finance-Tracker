'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
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
  Modal,
  TablePagination,
} from '@mui/material';

import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import { Plus, Eye, Pencil, Trash2, Search, X, CalendarDays } from 'lucide-react';
import { useTranslation } from '../../hooks/useTranslation';
import TransactionModal from '../../components/TransactionModal';
import TransactionDetailsModal from '../../components/TransactionDetailsModal';
import { Button as AppButton } from '../../components/ui/Button';
import { getClassificationLabel, getRegularityLabel } from '../../utils/classifySuggestion';
import { HABIT_GROUPS } from '../../utils/habitGroups';
import { resolveHabitMeta, matchesHabitFilter } from '../../utils/customHabitUtils';
import { CustomHabit } from '../../types';

const ES_MONTHS = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

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
function getTemporalBucket(dateStr: string): string {
  const today     = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const weekAgo   = new Date(today);
  weekAgo.setDate(today.getDate() - 7);

  const tx = new Date(dateStr + 'T12:00:00');

  const sameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth()    === b.getMonth()    &&
    a.getDate()     === b.getDate();

  if (sameDay(tx, today))     return 'Hoy';
  if (sameDay(tx, yesterday)) return 'Ayer';
  if (tx >= weekAgo)          return 'Esta semana';
  if (tx.getFullYear() === today.getFullYear() && tx.getMonth() === today.getMonth()) {
    return 'Este mes';
  }
  return 'Antiguos';
}

function groupByDate(txs: Transaction[]): { id: string; label: string; items: Transaction[] }[] {
  const groups: { id: string; label: string; items: Transaction[] }[] = [];
  let current = '';
  let idx = 0;
  for (const tx of txs) {
    const label = getTemporalBucket(tx.date);
    if (label !== current) {
      groups.push({ id: `${label}-${idx++}`, label, items: [] });
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
  tx, currencySymbol, customHabits, onView, onEdit, onDelete,
}: {
  tx: Transaction;
  currencySymbol: string;
  customHabits: CustomHabit[];
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
  const resolvedHabit = !isIncome
    ? resolveHabitMeta(tx.concept ?? tx.category?.name ?? '', tx.habitCategory, customHabits)
    : null;
  const habitMeta = resolvedHabit?.id !== 'otro' ? resolvedHabit : null;

  return (
    <div style={{
      background:   '#ffffff',
      borderRadius: '16px',
      border:       '1px solid rgba(0,0,0,0.06)',
      boxShadow:    '0 2px 8px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.04)',
      padding:      '12px 14px',
      display:      'flex',
      flexDirection:'column',
      gap:          '8px',
      minWidth:     0,
      maxWidth:     '100%',
      boxSizing:    'border-box',
      overflow:     'hidden',
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
          minWidth: 0,
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

      {/* Row 2: habit badge + cls badge + reg badge + date */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', paddingLeft: '18px' }}>
        {/* habit badge */}
        {habitMeta && (
          <span style={{
            fontSize: '11px',
            fontWeight: 600,
            padding: '2px 8px',
            borderRadius: '999px',
            background: habitMeta.bgColor,
            color: habitMeta.accentColor,
            border: `1px solid ${habitMeta.borderColor}`,
            display: 'inline-flex',
            alignItems: 'center',
            gap: '3px',
          }}>
            <span aria-hidden="true">{habitMeta.emoji}</span>
            {habitMeta.label}
          </span>
        )}

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

        {/* date — marginLeft:auto right-aligns without a spacer element */}
        <span style={{
          marginLeft: 'auto',
          flexShrink: 0,
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

/* ─── Active filter chip ────────────────────────────────────────────── */
function ActiveChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '2px',
      padding: '3px 6px 3px 10px',
      borderRadius: '999px',
      background: '#EEF2FF',
      border: '1px solid rgba(99,102,241,0.20)',
      color: '#4F46E5',
      fontSize: '11px', fontWeight: 600,
      whiteSpace: 'nowrap',
    }}>
      {label}
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Quitar filtro ${label}`}
        style={{
          background: 'none', border: 'none', padding: '0 2px',
          color: '#6366F1', cursor: 'pointer', lineHeight: 1,
          display: 'flex', alignItems: 'center',
        }}
      >
        <X size={11} />
      </button>
    </span>
  );
}

/* ─── Page ──────────────────────────────────────────────────────────── */
export default function TransactionsPage() {
  const { transactions, settings, customHabits, deleteTransaction, addTransaction } = useStore();

  /* ─── Habit filter chips (computed with custom habits) ──────────────── */
  const HABIT_CHIPS = useMemo(() => [
    { id: 'all', label: 'Todos', emoji: '✨' },
    ...HABIT_GROUPS.map(g => ({ id: g.id, label: g.label, emoji: g.emoji })),
    ...customHabits.filter(h => !h.archived).map(h => ({ id: h.id, label: h.label, emoji: h.emoji })),
  ], [customHabits]);
  const [filterSearch, setFilterSearch]             = useState('');
  const [filterType, setFilterType]                 = useState<'all' | 'income' | 'expense'>('all');
  const [filterHabit, setFilterHabit]               = useState('all');
  const [transactionToEdit, setTransactionToEdit]   = useState<Transaction | null>(null);
  const [undoTx, setUndoTx]                         = useState<Transaction | null>(null);
  const [transactionToView, setTransactionToView]   = useState<Transaction | null>(null);
  const [filterStartDate, setFilterStartDate]       = useState<string>('');
  const [filterEndDate, setFilterEndDate]           = useState<string>('');
  const [filterMonth, setFilterMonth]               = useState<string>('');
  const [filterYear, setFilterYear]                 = useState<string>('');
  const [isModalOpen, setIsModalOpen]               = useState(false);
  const [isFilterModalOpen, setIsFilterModalOpen]   = useState(false);
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
  const handleDeleteWithUndo = (tx: Transaction) => {
    deleteTransaction(tx.id);
    setUndoTx(tx);
    showSnackbar('Movimiento eliminado', 'success');
  };
  const handleUndo = () => {
    if (undoTx) {
      addTransaction(undoTx);
      setUndoTx(null);
      showSnackbar('Movimiento restaurado', 'info');
    }
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

  const clearAllFilters = () => {
    setFilterSearch('');
    setFilterType('all');
    setFilterHabit('all');
    setFilterStartDate('');
    setFilterEndDate('');
    setFilterMonth('');
    setFilterYear('');
    setPage(0);
  };

  const hasActiveFilters =
    filterSearch !== '' ||
    filterType !== 'all' ||
    filterHabit !== 'all' ||
    filterStartDate !== '' ||
    filterMonth !== '' ||
    filterYear !== '';

  const getCurrencySymbol = (currencyString: string) => {
    const parts = currencyString.split(' ');
    return parts[parts.length - 1];
  };
  const currencySymbol = getCurrencySymbol(settings.currency);

  const { t, loading } = useTranslation();

  const [snackbarOpen, setSnackbarOpen]           = useState(false);
  const [snackbarMessage, setSnackbarMessage]     = useState('');
  const [snackbarSeverity, setSnackbarSeverity]   = useState<'success' | 'error' | 'info' | 'warning'>('success');

  const showSnackbar = (message: string, severity: 'success' | 'error' | 'info' | 'warning') => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };
  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
    setUndoTx(null);
  };

  const sortedTransactions = useMemo(
    () => [...transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [transactions],
  );

  const filteredTransactions = useMemo(() => sortedTransactions.filter(transaction => {
    if (filterSearch) {
      const q       = filterSearch.toLowerCase();
      const concept = (transaction.concept ?? transaction.category?.name ?? '').toLowerCase();
      const notes   = (transaction.notes ?? '').toLowerCase();
      if (!concept.includes(q) && !notes.includes(q)) return false;
    }
    if (filterType !== 'all' && transaction.type !== filterType) return false;
    if (filterHabit !== 'all') {
      if (!matchesHabitFilter(transaction, filterHabit, customHabits)) return false;
    }
    const transactionDate = new Date(transaction.date);
    if (filterStartDate && filterEndDate) {
      const start = new Date(filterStartDate);
      const end   = new Date(filterEndDate);
      if (transactionDate < start || transactionDate > end) return false;
    }
    if (filterMonth) {
      if (transactionDate.getMonth() !== parseInt(filterMonth, 10) - 1) return false;
    }
    if (filterYear) {
      if (transactionDate.getFullYear().toString() !== filterYear) return false;
    }
    return true;
  }), [sortedTransactions, filterSearch, filterType, filterHabit, filterStartDate, filterEndDate, filterMonth, filterYear, customHabits]);

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

  /* ── Summary + smart empty state data ──────────────────────────────── */
  const { totalExpense, totalIncome, dominantHabit } = useMemo(() => {
    const expenseTxs = filteredTransactions.filter(t => t.type === 'expense');
    const totalExpense = expenseTxs.reduce((s, t) => s + t.amount, 0);
    const totalIncome  = filteredTransactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const habitTotals: Record<string, number> = {};
    for (const tx of expenseTxs) {
      const meta = resolveHabitMeta(tx.concept ?? tx.category?.name ?? '', tx.habitCategory, customHabits);
      if (meta.id !== 'otro') habitTotals[meta.id] = (habitTotals[meta.id] ?? 0) + tx.amount;
    }
    const topHabitId = Object.entries(habitTotals).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
    const dominantHabit = topHabitId
      ? (HABIT_GROUPS.find(g => g.id === topHabitId) ?? customHabits.find(h => h.id === topHabitId) ?? null)
      : null;
    return { totalExpense, totalIncome, dominantHabit };
  }, [filteredTransactions, customHabits]);

  const emptyFilterHabitMeta = filterHabit !== 'all'
    ? (HABIT_GROUPS.find(g => g.id === filterHabit) ?? customHabits.find(h => h.id === filterHabit) ?? null)
    : null;

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
      <Box sx={{ pt: 1, minWidth: 0, width: '100%', maxWidth: '100%', overflowX: 'hidden' }}>

        {/* ── Header ──────────────────────────────────────────────── */}
        <div className="flex items-center justify-between mb-4" style={{ gap: '8px', minWidth: 0 }}>
          <h1
            className="text-xl font-semibold tracking-tight text-gray-900"
            style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flexShrink: 1 }}
          >
            {t.transactions}
          </h1>
          <div style={{ flexShrink: 0 }}>
            <AppButton variant="primary" size="sm" onClick={() => handleOpenModal()}>
              <Plus size={14} aria-hidden="true" />
              <span className="hidden sm:inline">&nbsp;{t.add_new_transaction}</span>
            </AppButton>
          </div>
        </div>

        {/* ── Inline filter bar ────────────────────────────────────── */}
        <div style={{ marginBottom: '16px', minWidth: 0, width: '100%' }}>

          {/* Row 1: search */}
          <div style={{ position: 'relative', marginBottom: '10px' }}>
            <Search
              size={15}
              style={{
                position: 'absolute', left: '12px', top: '50%',
                transform: 'translateY(-50%)', color: '#9CA3AF', pointerEvents: 'none',
              }}
            />
            <input
              type="text"
              value={filterSearch}
              onChange={e => { setFilterSearch(e.target.value); setPage(0); }}
              placeholder="Buscar por concepto o nota…"
              style={{
                width: '100%', height: '40px',
                paddingLeft: '36px', paddingRight: filterSearch ? '36px' : '12px',
                borderRadius: '12px',
                border: '1.5px solid #E5E7EB',
                fontSize: '14px', color: '#111827',
                background: '#ffffff', outline: 'none',
                boxSizing: 'border-box', fontFamily: 'inherit',
              }}
              onFocus={e  => (e.currentTarget.style.borderColor = '#6366F1')}
              onBlur={e   => (e.currentTarget.style.borderColor = '#E5E7EB')}
            />
            {filterSearch && (
              <button
                type="button"
                onClick={() => { setFilterSearch(''); setPage(0); }}
                aria-label="Limpiar búsqueda"
                style={{
                  position: 'absolute', right: '10px', top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none', border: 'none', padding: '4px',
                  cursor: 'pointer', color: '#9CA3AF', display: 'flex', alignItems: 'center',
                }}
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Row 2: type chips + Fecha modal button */}
          <div style={{ display: 'flex', gap: '6px', marginBottom: '10px', alignItems: 'center' }}>
            {(['all', 'expense', 'income'] as const).map(opt => {
              const active = filterType === opt;
              const label  = opt === 'all' ? 'Todos' : opt === 'expense' ? 'Gastos' : 'Ingresos';
              const activeBg =
                opt === 'expense' ? '#FFF1F2' :
                opt === 'income'  ? '#F0FDF4' :
                '#111827';
              const activeColor =
                opt === 'expense' ? '#BE123C' :
                opt === 'income'  ? '#15803D' :
                '#ffffff';
              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() => { setFilterType(opt); setPage(0); }}
                  style={{
                    padding: '5px 12px', borderRadius: '999px',
                    border: active ? 'none' : '1.5px solid #E5E7EB',
                    background: active ? activeBg : '#ffffff',
                    color: active ? activeColor : '#6B7280',
                    fontSize: '12px', fontWeight: 600, cursor: 'pointer',
                    transition: 'all 120ms ease',
                  }}
                >
                  {label}
                </button>
              );
            })}
            <div style={{ flex: 1 }} />
            <button
              type="button"
              onClick={handleOpenFilterModal}
              style={{
                display: 'flex', alignItems: 'center', gap: '5px',
                padding: '5px 11px', borderRadius: '999px',
                border: (filterStartDate || filterMonth || filterYear)
                  ? '1.5px solid #6366F1'
                  : '1.5px solid #E5E7EB',
                background: (filterStartDate || filterMonth || filterYear) ? '#EEF2FF' : '#ffffff',
                color: (filterStartDate || filterMonth || filterYear) ? '#4F46E5' : '#6B7280',
                fontSize: '12px', fontWeight: 600, cursor: 'pointer',
                transition: 'all 120ms ease',
              }}
            >
              <CalendarDays size={13} />
              Fecha
              {(filterStartDate || filterMonth || filterYear) && (
                <span style={{
                  width: '6px', height: '6px', borderRadius: '50%',
                  background: '#6366F1', flexShrink: 0,
                }} />
              )}
            </button>
          </div>

          {/* Row 3: habit chips (horizontally scrollable) */}
          <div style={{
            display: 'flex', gap: '6px', overflowX: 'auto',
            paddingBottom: '4px', marginBottom: '8px',
            scrollbarWidth: 'none',
            WebkitOverflowScrolling: 'touch',
            width: '100%', minWidth: 0,
          }}>
            {HABIT_CHIPS.map(chip => {
              const active = filterHabit === chip.id;
              return (
                <button
                  key={chip.id}
                  type="button"
                  onClick={() => { setFilterHabit(chip.id); setPage(0); }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '4px',
                    padding: '5px 10px', borderRadius: '999px',
                    border: active ? 'none' : '1.5px solid #E5E7EB',
                    background: active ? '#111827' : '#ffffff',
                    color: active ? '#ffffff' : '#6B7280',
                    fontSize: '12px', fontWeight: 600, cursor: 'pointer',
                    whiteSpace: 'nowrap', flexShrink: 0,
                    transition: 'all 120ms ease',
                  }}
                >
                  <span aria-hidden="true">{chip.emoji}</span>
                  {chip.label}
                </button>
              );
            })}
          </div>

          {/* Row 4: active filter chips (conditional) */}
          {hasActiveFilters && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center' }}>
              {filterSearch && (
                <ActiveChip label={`"${filterSearch}"`} onRemove={() => { setFilterSearch(''); setPage(0); }} />
              )}
              {filterType !== 'all' && (
                <ActiveChip
                  label={filterType === 'expense' ? 'Gastos' : 'Ingresos'}
                  onRemove={() => { setFilterType('all'); setPage(0); }}
                />
              )}
              {filterHabit !== 'all' && (
                <ActiveChip
                  label={
                    HABIT_GROUPS.find(g => g.id === filterHabit)?.label ??
                    customHabits.find(h => h.id === filterHabit)?.label ??
                    filterHabit
                  }
                  onRemove={() => { setFilterHabit('all'); setPage(0); }}
                />
              )}
              {filterStartDate && filterEndDate && (
                <ActiveChip
                  label={`${filterStartDate} — ${filterEndDate}`}
                  onRemove={() => { setFilterStartDate(''); setFilterEndDate(''); setPage(0); }}
                />
              )}
              {filterMonth && (
                <ActiveChip
                  label={ES_MONTHS[parseInt(filterMonth, 10) - 1] ?? filterMonth}
                  onRemove={() => { setFilterMonth(''); setPage(0); }}
                />
              )}
              {filterYear && (
                <ActiveChip
                  label={filterYear}
                  onRemove={() => { setFilterYear(''); setPage(0); }}
                />
              )}
              <button
                type="button"
                onClick={clearAllFilters}
                style={{
                  padding: '3px 10px', borderRadius: '999px',
                  border: 'none', background: '#FFF1F2',
                  color: '#BE123C', fontSize: '11px', fontWeight: 700, cursor: 'pointer',
                }}
              >
                Limpiar todos
              </button>
            </div>
          )}
        </div>

        {/* ── Filter modal (date / month / year) ───────────────────── */}
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
            width: { xs: '90%', sm: 400 },
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
              <Button variant="outlined" onClick={clearAllFilters} sx={iosButtonStyleError}>
                {t.clear_filters}
              </Button>
            </Box>
          </Box>
        </Modal>

        {/* ── Contextual summary bar ───────────────────────────────── */}
        {filteredTransactions.length > 0 && (
          <div style={{
            display:      'flex',
            alignItems:   'center',
            gap:          '10px',
            padding:      '10px 14px',
            marginBottom: '12px',
            background:   '#F8FAFC',
            borderRadius: '12px',
            border:       '1px solid rgba(0,0,0,0.06)',
            flexWrap:     'wrap',
          }}>
            <span style={{ fontSize: '13px', color: '#374151', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
              {filteredTransactions.length} {filteredTransactions.length === 1 ? 'movimiento' : 'movimientos'}
            </span>
            {totalExpense > 0 && filterType !== 'income' && (
              <>
                <span style={{ color: '#D1D5DB', fontSize: '13px' }}>·</span>
                <span style={{ fontSize: '13px', color: '#E11D48', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
                  − {currencySymbol} {totalExpense.toFixed(2)}
                </span>
              </>
            )}
            {totalIncome > 0 && filterType !== 'expense' && (
              <>
                <span style={{ color: '#D1D5DB', fontSize: '13px' }}>·</span>
                <span style={{ fontSize: '13px', color: '#059669', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
                  + {currencySymbol} {totalIncome.toFixed(2)}
                </span>
              </>
            )}
            {dominantHabit && filterHabit === 'all' && (
              <>
                <span style={{ color: '#D1D5DB', fontSize: '13px' }}>·</span>
                <span style={{ fontSize: '12px', color: '#6B7280' }}>
                  <span aria-hidden="true">{dominantHabit.emoji}</span>
                  {' '}
                  <span style={{ color: dominantHabit.accentColor, fontWeight: 600 }}>{dominantHabit.label}</span>
                  {' '}es tu hábito principal
                </span>
              </>
            )}
          </div>
        )}

        {/* ── Mobile card list (xs only — CSS responsive, SSR-safe) ── */}
        <Box sx={{ display: { xs: 'flex', sm: 'none' }, flexDirection: 'column', gap: 0, width: '100%', minWidth: 0 }}>

            {/* Empty state — first time */}
            {transactions.length === 0 && (
              <div style={{
                textAlign: 'center', padding: '56px 24px',
                background: '#ffffff', borderRadius: '16px',
                border: '1px solid rgba(0,0,0,0.06)',
              }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>🌱</div>
                <p style={{ fontSize: '17px', fontWeight: 700, color: '#111827', margin: '0 0 8px', letterSpacing: '-0.02em' }}>
                  Todavía no tienes movimientos
                </p>
                <p style={{ fontSize: '14px', color: '#6B7280', margin: '0 0 24px', lineHeight: 1.6 }}>
                  Registra tu primer gasto o ingreso para empezar a construir tus hábitos financieros.
                </p>
                <Link
                  href="/registro"
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: '6px',
                    padding: '10px 20px', borderRadius: '12px',
                    background: 'linear-gradient(135deg, #10B981, #14B8A6)',
                    color: '#ffffff', fontSize: '14px', fontWeight: 700,
                    textDecoration: 'none',
                    boxShadow: '0 4px 16px rgba(16,185,129,0.30)',
                  }}
                >
                  Registrar ahora
                </Link>
              </div>
            )}

            {/* Empty state — no filter results */}
            {filteredTransactions.length === 0 && transactions.length > 0 && (
              <div style={{
                textAlign: 'center', padding: '40px 24px',
                background: '#ffffff', borderRadius: '16px',
                border: '1px solid rgba(0,0,0,0.06)',
              }}>
                <div style={{ fontSize: '40px', marginBottom: '12px' }}>
                  {emptyFilterHabitMeta ? emptyFilterHabitMeta.emoji : '🔍'}
                </div>
                <p style={{ fontSize: '15px', fontWeight: 600, color: '#111827', margin: '0 0 6px' }}>
                  {emptyFilterHabitMeta
                    ? `Sin movimientos de ${emptyFilterHabitMeta.label}`
                    : 'Sin resultados'
                  }
                </p>
                <p style={{ fontSize: '13px', color: '#9CA3AF', margin: '0 0 20px', lineHeight: 1.6 }}>
                  {emptyFilterHabitMeta
                    ? `No encontramos gastos de ${emptyFilterHabitMeta.label} con los filtros activos.`
                    : 'Ningún movimiento coincide con los filtros activos.'
                  }
                </p>
                <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={clearAllFilters}
                    style={{
                      padding: '8px 18px', borderRadius: '10px',
                      border: '1.5px solid #E5E7EB', background: '#F9FAFB',
                      color: '#374151', fontSize: '13px', fontWeight: 600, cursor: 'pointer',
                    }}
                  >
                    Limpiar filtros
                  </button>
                  {emptyFilterHabitMeta && (
                    <Link
                      href="/registro"
                      style={{
                        display: 'inline-flex', alignItems: 'center',
                        padding: '8px 18px', borderRadius: '10px',
                        background: 'linear-gradient(135deg, #10B981, #14B8A6)',
                        color: '#ffffff', fontSize: '13px', fontWeight: 700,
                        textDecoration: 'none',
                      }}
                    >
                      Registrar movimiento
                    </Link>
                  )}
                </div>
              </div>
            )}

            {/* Date groups */}
            {dateGroups.map(group => (
              <div key={group.id} style={{ marginBottom: '8px', minWidth: 0 }}>

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
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', minWidth: 0 }}>
                  {group.items.map(tx => (
                    <TxCard
                      key={tx.id}
                      tx={tx}
                      currencySymbol={currencySymbol}
                      customHabits={customHabits}
                      onView={()   => handleOpenViewModal(tx)}
                      onEdit={()   => handleOpenModal(tx)}
                      onDelete={()  => handleDeleteWithUndo(tx)}
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
        </Box>

        {/* ── Desktop table (sm+ only — CSS responsive, SSR-safe) ─── */}
        <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
          <Paper sx={{ overflowX: 'auto' }}>
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
                  {paginatedTransactions.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                        {transactions.length === 0 ? (
                          <div>
                            <div style={{ fontSize: '40px', marginBottom: '12px' }}>🌱</div>
                            <p style={{ fontSize: '16px', fontWeight: 600, color: '#111827', margin: '0 0 6px' }}>
                              Todavía no tienes movimientos
                            </p>
                            <p style={{ fontSize: '14px', color: '#9CA3AF', margin: '0 0 16px' }}>
                              Registra tu primer gasto o ingreso en la sección Registro.
                            </p>
                            <Link href="/registro" style={{
                              display: 'inline-flex', padding: '8px 20px',
                              borderRadius: '10px',
                              background: 'linear-gradient(135deg, #10B981, #14B8A6)',
                              color: '#ffffff', fontSize: '14px', fontWeight: 600,
                              textDecoration: 'none',
                            }}>
                              Ir a Registro
                            </Link>
                          </div>
                        ) : (
                          <div>
                            <div style={{ fontSize: '36px', marginBottom: '10px' }}>
                              {emptyFilterHabitMeta ? emptyFilterHabitMeta.emoji : '🔍'}
                            </div>
                            <p style={{ fontSize: '15px', fontWeight: 600, color: '#111827', margin: '0 0 4px' }}>
                              {emptyFilterHabitMeta
                                ? `Sin movimientos de ${emptyFilterHabitMeta.label}`
                                : 'Sin resultados'
                              }
                            </p>
                            <p style={{ fontSize: '13px', color: '#9CA3AF', margin: '0 0 12px' }}>
                              {emptyFilterHabitMeta
                                ? `No encontramos gastos de ${emptyFilterHabitMeta.label} con los filtros activos.`
                                : 'Ningún movimiento coincide con los filtros activos.'
                              }
                            </p>
                            {emptyFilterHabitMeta && (
                              <Link
                                href="/registro"
                                style={{
                                  display: 'inline-flex', padding: '8px 16px',
                                  borderRadius: '10px',
                                  background: 'linear-gradient(135deg, #10B981, #14B8A6)',
                                  color: '#ffffff', fontSize: '13px', fontWeight: 600,
                                  textDecoration: 'none',
                                }}
                              >
                                Registrar movimiento
                              </Link>
                            )}
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  )}
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
                          onClick={() => handleDeleteWithUndo(transaction)}
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
        </Box>

        {/* ── Transaction edit modal ───────────────────────────────── */}
        {isModalOpen && (
          <TransactionModal
            open={isModalOpen}
            onClose={handleCloseModal}
            transaction={transactionToEdit}
            showSnackbar={showSnackbar}
          />
        )}

        {/* ── Transaction details modal ────────────────────────────── */}
        <TransactionDetailsModal
          open={isViewModalOpen}
          onClose={handleCloseViewModal}
          transaction={transactionToView}
        />

      </Box>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={undoTx ? 5000 : 4000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={handleSnackbarClose}
          severity={snackbarSeverity}
          sx={{ width: '100%' }}
          action={undoTx ? (
            <Button
              color="inherit"
              size="small"
              onClick={handleUndo}
              sx={{ fontWeight: 700, fontSize: '13px', textTransform: 'none' }}
            >
              Deshacer
            </Button>
          ) : undefined}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </>
  );
}
