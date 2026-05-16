'use client';

import { useState } from 'react';
import { useStore } from '../store/useStore';
import {
  Paper,
  Typography,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  LinearProgress,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useTranslation } from '../hooks/useTranslation';
import { SkeletonLoader } from '../components/Loader';
import { getDailyPhrase } from '../utils/motivationalPhrases';
import { getPeriodMetrics, getDailySuggestions, DEFAULT_DAILY_LIMIT, type Period, PERIOD_LABELS } from '../utils/financialSuggestions';
import { getClassificationLabel } from '../utils/classifySuggestion';
import type { ExpenseClassification, IncomeClassification } from '../types';

// ── Shared styles ──────────────────────────────────────────────────────────

const glassCardSx = {
  backdropFilter: 'blur(20px)',
  border: '1px solid rgba(255, 255, 255, 0.2)',
  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
  position: 'relative' as const,
  overflow: 'hidden' as const,
  '&::before': {
    content: '""',
    position: 'absolute' as const,
    top: 0, left: 0, right: 0, bottom: 0,
    background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
    pointerEvents: 'none' as const,
    zIndex: -1,
  },
};

const chartPaperSx = {
  py: 3,
  mb: 4,
  backgroundColor: 'rgba(255, 255, 255, 0.1)',
  backdropFilter: 'blur(20px)',
  border: '1px solid rgba(255, 255, 255, 0.2)',
  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
  borderRadius: 2,
  position: 'relative' as const,
  overflow: 'hidden' as const,
  '&::before': {
    content: '""',
    position: 'absolute' as const,
    top: 0, left: 0, right: 0, bottom: 0,
    background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
    pointerEvents: 'none' as const,
    zIndex: -1,
  },
};

// ── Component ──────────────────────────────────────────────────────────────

export default function HomePage() {
  const { transactions, settings } = useStore();
  const [selectedMonthlyYear, setSelectedMonthlyYear] = useState<string>(new Date().getFullYear().toString());
  const [selectedPeriod, setSelectedPeriod]           = useState<Period>('today');

  const getCurrencySymbol = (s: string) => s.split(' ').at(-1) ?? '';
  const cur = getCurrencySymbol(settings.currency);

  const { t, loading } = useTranslation();

  // ── Global totals (all time) ───────────────────────────────────────────
  const totalIncome   = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const totalExpenses = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const totalBalance  = totalIncome - totalExpenses;

  const allClassTotals = transactions
    .filter(t => t.type === 'expense')
    .reduce((acc: Record<string, number>, t) => {
      const key = t.classification ?? 'otro';
      acc[key] = (acc[key] || 0) + t.amount;
      return acc;
    }, {});
  const topOverallKey   = Object.entries(allClassTotals).sort(([, a], [, b]) => b - a)[0]?.[0] ?? null;
  const topOverallLabel = topOverallKey
    ? getClassificationLabel(topOverallKey as ExpenseClassification | IncomeClassification, 'expense')
    : '—';

  // ── Chart data ─────────────────────────────────────────────────────────
  const years = Array.from(new Set(transactions.map(t => new Date(t.date).getFullYear().toString()))).sort();

  const months = [
    { value: '1',  label: 'January'   }, { value: '2',  label: 'February'  },
    { value: '3',  label: 'March'     }, { value: '4',  label: 'April'     },
    { value: '5',  label: 'May'       }, { value: '6',  label: 'June'      },
    { value: '7',  label: 'July'      }, { value: '8',  label: 'August'    },
    { value: '9',  label: 'September' }, { value: '10', label: 'October'   },
    { value: '11', label: 'November'  }, { value: '12', label: 'December'  },
  ];

  const yearlyData = years.map(year => ({
    year,
    income:  transactions.filter(t => new Date(t.date).getFullYear().toString() === year && t.type === 'income').reduce((s, t) => s + t.amount, 0),
    expense: transactions.filter(t => new Date(t.date).getFullYear().toString() === year && t.type === 'expense').reduce((s, t) => s + t.amount, 0),
  }));

  const monthlyData = months.map(m => ({
    month: m.label,
    income:  transactions.filter(t => new Date(t.date).getMonth() === (parseInt(m.value, 10) - 1) && new Date(t.date).getFullYear().toString() === selectedMonthlyYear && t.type === 'income').reduce((s, t) => s + t.amount, 0),
    expense: transactions.filter(t => new Date(t.date).getMonth() === (parseInt(m.value, 10) - 1) && new Date(t.date).getFullYear().toString() === selectedMonthlyYear && t.type === 'expense').reduce((s, t) => s + t.amount, 0),
  }));

  const categorySpending = transactions
    .filter(t => t.type === 'expense')
    .reduce((acc: Record<string, number>, t) => {
      const key = t.concept?.trim() || t.category?.name || '(sin concepto)';
      acc[key] = (acc[key] || 0) + t.amount;
      return acc;
    }, {});

  const categoryChartData = Object.keys(categorySpending).map(category => ({
    category,
    spending: categorySpending[category],
  }));

  // ── Period metrics ─────────────────────────────────────────────────────
  const periodMetrics = getPeriodMetrics(transactions, selectedPeriod);
  const suggestions   = getDailySuggestions(transactions);
  const dailyPhrase   = getDailyPhrase();

  if (loading) {
    return <Box sx={{ pt: 1 }}><SkeletonLoader /></Box>;
  }

  return (
    <>
      <Box sx={{ pt: 1 }}>

        <Typography variant="h4" component="h1" gutterBottom>
          {t.expense_tracker}
        </Typography>

        {/* Frase motivacional */}
        <Typography variant="body2" sx={{ fontStyle: 'italic', color: 'text.secondary', mb: 3, opacity: 0.75 }}>
          &ldquo;{dailyPhrase}&rdquo;
        </Typography>

        {/* ── RESUMEN ACTUAL ────────────────────────────────────────────
            Siempre visible. No depende del filtro de período.            */}
        <Typography variant="h6" component="h2" gutterBottom>
          Resumen actual
        </Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', sm: 'repeat(3, 1fr)' }, gap: 2, mb: 4 }}>

          <Paper elevation={0} sx={{
            ...glassCardSx, p: 2,
            bgcolor: totalBalance >= 0 ? 'rgba(2,136,209,0.15)' : 'rgba(211,47,47,0.15)',
            color:   totalBalance >= 0 ? 'info.main'            : 'error.main',
          }}>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>Balance total</Typography>
            <Typography variant="h6">
              {totalBalance >= 0 ? '+' : ''}{cur} {totalBalance.toFixed(2)}
            </Typography>
          </Paper>

          <Paper elevation={0} sx={{ ...glassCardSx, p: 2, bgcolor: 'rgba(76,175,80,0.15)', color: 'success.main' }}>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>Ingresos totales</Typography>
            <Typography variant="h6">{cur} {totalIncome.toFixed(2)}</Typography>
          </Paper>

          <Paper elevation={0} sx={{ ...glassCardSx, p: 2, bgcolor: 'rgba(211,47,47,0.15)', color: 'error.main' }}>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>Gastos totales</Typography>
            <Typography variant="h6">{cur} {totalExpenses.toFixed(2)}</Typography>
          </Paper>

          <Paper elevation={0} sx={{
            ...glassCardSx, p: 2,
            bgcolor: totalBalance >= 0 ? 'rgba(56,142,60,0.15)'  : 'rgba(255,152,0,0.15)',
            color:   totalBalance >= 0 ? 'success.dark'           : 'warning.main',
          }}>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>Disponible</Typography>
            <Typography variant="h6">
              {cur} {Math.abs(totalBalance).toFixed(2)}
              {totalBalance < 0 && (
                <Typography component="span" variant="caption" sx={{ ml: 0.5 }}>
                  déficit
                </Typography>
              )}
            </Typography>
          </Paper>

          <Paper elevation={0} sx={{ ...glassCardSx, p: 2, bgcolor: 'rgba(96,125,139,0.15)' }}>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>Total movimientos</Typography>
            <Typography variant="h6">{transactions.length}</Typography>
          </Paper>

          <Paper elevation={0} sx={{ ...glassCardSx, p: 2, bgcolor: 'rgba(103,58,183,0.15)', color: 'secondary.main' }}>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>Mayor gasto acumulado</Typography>
            <Typography variant="h6" sx={{ fontSize: '1rem' }}>{topOverallLabel}</Typography>
          </Paper>

        </Box>

        {/* ── RESUMEN DEL PERIODO ───────────────────────────────────────
            Filtro: Hoy / Ayer / Esta semana / Este mes                  */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1, flexWrap: 'wrap', gap: 1 }}>
          <Typography variant="h6" component="h2">
            Resumen del periodo
          </Typography>
          <ToggleButtonGroup
            value={selectedPeriod}
            exclusive
            onChange={(_e, v: Period | null) => { if (v) setSelectedPeriod(v); }}
            size="small"
          >
            {(Object.keys(PERIOD_LABELS) as Period[]).map(p => (
              <ToggleButton key={p} value={p} sx={{ textTransform: 'none', fontSize: '0.8rem', py: 0.5, px: 1.5 }}>
                {PERIOD_LABELS[p]}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
        </Box>

        {periodMetrics.transactionCount === 0 ? (
          <Paper elevation={0} sx={{ ...glassCardSx, p: 3, mb: 3, bgcolor: 'rgba(255,255,255,0.06)', textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              No hay movimientos en este periodo. Revisa otro periodo o registra un nuevo movimiento.
            </Typography>
          </Paper>
        ) : (
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', sm: 'repeat(3, 1fr)' }, gap: 2, mb: 2 }}>

            <Paper elevation={0} sx={{ ...glassCardSx, p: 2, bgcolor: 'rgba(211,47,47,0.15)', color: 'error.main' }}>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>Gasto</Typography>
              <Typography variant="h6">{cur} {periodMetrics.totalExpense.toFixed(2)}</Typography>
            </Paper>

            <Paper elevation={0} sx={{ ...glassCardSx, p: 2, bgcolor: 'rgba(76,175,80,0.15)', color: 'success.main' }}>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>Ingreso</Typography>
              <Typography variant="h6">{cur} {periodMetrics.totalIncome.toFixed(2)}</Typography>
            </Paper>

            <Paper elevation={0} sx={{
              ...glassCardSx, p: 2,
              bgcolor: 'rgba(2,136,209,0.15)',
              color:   periodMetrics.balance >= 0 ? 'success.main' : 'error.main',
            }}>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>Balance</Typography>
              <Typography variant="h6">
                {periodMetrics.balance >= 0 ? '+' : ''}{cur} {periodMetrics.balance.toFixed(2)}
              </Typography>
            </Paper>

            <Paper elevation={0} sx={{ ...glassCardSx, p: 2, bgcolor: 'rgba(255,152,0,0.15)', color: 'warning.main' }}>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>Hormiga</Typography>
              <Typography variant="h6">{cur} {periodMetrics.hormigas.toFixed(2)}</Typography>
            </Paper>

            <Paper elevation={0} sx={{ ...glassCardSx, p: 2, bgcolor: 'rgba(103,58,183,0.15)', color: 'secondary.main' }}>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>Mayor gasto</Typography>
              <Typography variant="h6" sx={{ fontSize: '1rem' }}>
                {periodMetrics.topClassificationLabel ?? '—'}
              </Typography>
            </Paper>

            <Paper elevation={0} sx={{ ...glassCardSx, p: 2, bgcolor: 'rgba(96,125,139,0.15)' }}>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>Movimientos</Typography>
              <Typography variant="h6">{periodMetrics.transactionCount}</Typography>
            </Paper>

          </Box>
        )}

        {/* Límite diario — solo cuando período = Hoy y hay movimientos */}
        {selectedPeriod === 'today' && periodMetrics.transactionCount > 0 && (
          <Paper elevation={0} sx={{
            ...glassCardSx, p: 2, mb: 3,
            bgcolor: periodMetrics.dailyLimitExceeded ? 'rgba(211,47,47,0.15)' : 'rgba(255,255,255,0.08)',
          }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2" sx={{ fontWeight: 600, color: periodMetrics.dailyLimitExceeded ? 'error.main' : 'text.primary' }}>
                {periodMetrics.dailyLimitExceeded ? '⚠ Límite diario superado' : 'Límite diario'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {cur} {periodMetrics.totalExpense.toFixed(2)} / {cur} {DEFAULT_DAILY_LIMIT}
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={periodMetrics.dailyLimitProgress}
              color={periodMetrics.dailyLimitExceeded ? 'error' : periodMetrics.dailyLimitProgress > 80 ? 'warning' : 'primary'}
              sx={{ height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.1)' }}
            />
          </Paper>
        )}

        {/* Sugerencias del día — siempre basadas en hoy */}
        {suggestions.length > 0 && (
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" component="h2" gutterBottom>
              Sugerencias del día
            </Typography>
            {suggestions.map((s, i) => (
              <Paper key={i} elevation={0} sx={{ ...glassCardSx, p: 2, mb: 1, bgcolor: 'rgba(255,255,255,0.08)' }}>
                <Typography variant="body2">{s}</Typography>
              </Paper>
            ))}
          </Box>
        )}

        {/* ── GRÁFICAS ────────────────────────────────────────────────── */}
        <Typography variant="h5" component="h2" gutterBottom sx={{ mt: 4 }}>
          Vista anual
        </Typography>
        <Paper elevation={0} sx={chartPaperSx}>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={yearlyData} margin={{ top: 5, right: 0, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="year" />
              <YAxis />
              <Tooltip formatter={(value: number) => `${cur} ${value.toFixed(2)}`} />
              <Legend />
              <Line type="monotone" dataKey="income"  stroke="#82ca9d" activeDot={{ r: 8 }} />
              <Line type="monotone" dataKey="expense" stroke="#8884d8" />
            </LineChart>
          </ResponsiveContainer>
        </Paper>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 4, mb: 2 }}>
          <Typography variant="h5" component="h2">Vista mensual</Typography>
          <FormControl sx={{ minWidth: 120 }}>
            <InputLabel>Año</InputLabel>
            <Select value={selectedMonthlyYear} onChange={e => setSelectedMonthlyYear(e.target.value)} label="Año">
              {years.map(y => <MenuItem key={y} value={y}>{y}</MenuItem>)}
            </Select>
          </FormControl>
        </Box>
        <Paper elevation={0} sx={chartPaperSx}>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={monthlyData} margin={{ top: 5, right: 0, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value: number) => `${cur} ${value.toFixed(2)}`} />
              <Legend />
              <Line type="monotone" dataKey="income"  stroke="#82ca9d" activeDot={{ r: 8 }} />
              <Line type="monotone" dataKey="expense" stroke="#8884d8" />
            </LineChart>
          </ResponsiveContainer>
        </Paper>

        <Typography variant="h5" component="h2" gutterBottom sx={{ mt: 4 }}>
          Gasto por concepto
        </Typography>
        <Paper elevation={0} sx={chartPaperSx}>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={categoryChartData} margin={{ top: 5, right: 0, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="category" />
              <YAxis />
              <Tooltip formatter={(value: number) => `${cur} ${value.toFixed(2)}`} />
              <Legend />
              <Bar dataKey="spending" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        </Paper>

      </Box>
    </>
  );
}
