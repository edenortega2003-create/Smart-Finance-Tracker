'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useStore } from '../store/useStore';
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import {
  TrendingUp, TrendingDown, Wallet, BarChart2, Tag, Coffee, Zap,
  Plus, ArrowLeftRight, Settings,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from '../hooks/useTranslation';
import { SkeletonLoader } from '../components/Loader';
import { getDailyPhrase } from '../utils/motivationalPhrases';
import {
  getPeriodMetrics, getDailySuggestions, DEFAULT_DAILY_LIMIT,
  type Period, PERIOD_LABELS,
} from '../utils/financialSuggestions';
import { getClassificationLabel } from '../utils/classifySuggestion';
import type { ExpenseClassification, IncomeClassification } from '../types';
import { MetricCard } from '../components/financial/MetricCard';
import { Progress } from '../components/ui/Progress';

// Inline style values — guaranteed to render regardless of Tailwind scanning
const INCOME_COLOR  = '#10B981';
const EXPENSE_COLOR = '#FB7185';

const HERO_STYLE: React.CSSProperties = {
  background:    'linear-gradient(135deg, #10B981 0%, #14B8A6 50%, #06B6D4 100%)',
  borderRadius:  '24px',
  padding:       '24px',
  position:      'relative',
  overflow:      'hidden',
  boxShadow:     '0 20px 60px rgba(16,185,129,0.28), 0 8px 20px rgba(16,185,129,0.18)',
  marginBottom:  '16px',
};

const mxnFmt = new Intl.NumberFormat('es-MX', {
  style: 'currency', currency: 'MXN',
  minimumFractionDigits: 2, maximumFractionDigits: 2,
});

const ChartTooltip = ({ active, payload, label }: {
  active?: boolean;
  payload?: { name: string; value: number; color: string }[];
  label?: string;
}) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ borderRadius: '12px', backgroundColor: 'rgba(19,43,45,0.92)', backdropFilter: 'blur(8px)', border: '1px solid rgba(153,246,228,0.2)', padding: '10px 14px', boxShadow: '0 8px 32px rgba(0,0,0,0.3)' }}>
      {label && <p style={{ fontSize: '11px', color: '#99F6E4', marginBottom: '6px' }}>{label}</p>}
      {payload.map(entry => (
        <p key={entry.name} style={{ fontSize: '13px', fontWeight: 600, color: entry.color, fontVariantNumeric: 'tabular-nums' }}>
          {entry.name}: {mxnFmt.format(entry.value)}
        </p>
      ))}
    </div>
  );
};

// Quick action configuration — uses globals.css classes for tile/icon colors
const quickActions = [
  { label: 'Agregar',     tileClass: 'qa-green',  iconClass: 'qa-icon-green',  icon: <Plus           size={20} />, isFab: true,  href: null             },
  { label: 'Historial',   tileClass: 'qa-sky',    iconClass: 'qa-icon-sky',    icon: <ArrowLeftRight size={20} />, isFab: false, href: '/transactions'  },
  { label: 'Categorías',  tileClass: 'qa-purple', iconClass: 'qa-icon-purple', icon: <Tag            size={20} />, isFab: false, href: '/categories'    },
  { label: 'Ajustes',     tileClass: 'qa-amber',  iconClass: 'qa-icon-amber',  icon: <Settings       size={20} />, isFab: false, href: '/settings'      },
] as const;

export default function HomePage() {
  const { transactions } = useStore();
  const [selectedMonthlyYear, setSelectedMonthlyYear] = useState<string>(
    new Date().getFullYear().toString(),
  );
  const [selectedPeriod, setSelectedPeriod] = useState<Period>('today');
  const { t, loading } = useTranslation();

  // ── Global totals — unchanged logic ───────────────────────────────────────
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

  // ── Chart data — unchanged logic ───────────────────────────────────────────
  const years = Array.from(
    new Set(transactions.map(t => new Date(t.date).getFullYear().toString())),
  ).sort();

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
    month: m.label.slice(0, 3),
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

  // ── Period metrics — unchanged logic ───────────────────────────────────────
  const periodMetrics = getPeriodMetrics(transactions, selectedPeriod);
  const suggestions   = getDailySuggestions(transactions);
  const dailyPhrase   = getDailyPhrase();

  if (loading) {
    return <div className="pt-2"><SkeletonLoader /></div>;
  }

  return (
    <div className="pt-2 pb-12">

      {/* ── Motivational phrase ────────────────────────────────────────────── */}
      <div className="flex items-start gap-2 mb-6">
        <Zap size={13} style={{ color: '#F59E0B', flexShrink: 0, marginTop: '2px' }} aria-hidden="true" />
        <p style={{ fontSize: '13px', color: 'rgba(120,53,15,0.5)', fontStyle: 'italic', lineHeight: 1.6, margin: 0 }}>
          &ldquo;{dailyPhrase}&rdquo;
        </p>
      </div>

      {/* ══ HERO: Balance total ════════════════════════════════════════════════ */}
      <div style={HERO_STYLE}>
        {/* Decorative orbs — inline style, guaranteed to render */}
        <div style={{ position: 'absolute', top: '-56px', right: '-56px', width: '224px', height: '224px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.08)', filter: 'blur(40px)', pointerEvents: 'none' }} aria-hidden="true" />
        <div style={{ position: 'absolute', bottom: '-80px', left: '-32px', width: '208px', height: '208px', borderRadius: '50%', backgroundColor: 'rgba(52,211,153,0.14)', filter: 'blur(40px)', pointerEvents: 'none' }} aria-hidden="true" />

        <div style={{ position: 'relative', zIndex: 1 }}>
          {/* Label row */}
          <div className="flex items-center justify-between" style={{ marginBottom: '12px' }}>
            <p style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.70)', margin: 0 }}>
              Balance Total
            </p>
            <div style={{ width: '36px', height: '36px', borderRadius: '12px', backgroundColor: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }} aria-hidden="true">
              <Wallet size={16} style={{ color: '#ffffff' }} />
            </div>
          </div>

          {/* Balance number */}
          <p style={{
            fontSize: 'clamp(36px, 8vw, 52px)',
            fontWeight: 700,
            fontVariantNumeric: 'tabular-nums',
            lineHeight: 1,
            letterSpacing: '-0.02em',
            color: totalBalance < 0 ? '#FDA4AF' : '#ffffff',
            margin: 0,
          }}>
            {mxnFmt.format(totalBalance)}
          </p>
          {totalBalance < 0 && (
            <p style={{ fontSize: '12px', color: '#FDA4AF', marginTop: '6px', fontWeight: 500 }}>En déficit</p>
          )}

          {/* Income / Expense pills */}
          <div className="flex flex-wrap gap-3" style={{ marginTop: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', backgroundColor: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)', borderRadius: '12px', padding: '10px 16px' }}>
              <TrendingUp size={13} style={{ color: '#6EE7B7', flexShrink: 0 }} aria-hidden="true" />
              <div>
                <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.70)', fontWeight: 500, lineHeight: 1, marginBottom: '2px', margin: 0 }}>Ingresos</p>
                <p style={{ fontSize: '13px', fontWeight: 700, color: '#ffffff', fontVariantNumeric: 'tabular-nums', lineHeight: 1, margin: 0 }}>
                  {mxnFmt.format(totalIncome)}
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', backgroundColor: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)', borderRadius: '12px', padding: '10px 16px' }}>
              <TrendingDown size={13} style={{ color: '#FCA5A5', flexShrink: 0 }} aria-hidden="true" />
              <div>
                <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.70)', fontWeight: 500, lineHeight: 1, marginBottom: '2px', margin: 0 }}>Gastos</p>
                <p style={{ fontSize: '13px', fontWeight: 700, color: '#ffffff', fontVariantNumeric: 'tabular-nums', lineHeight: 1, margin: 0 }}>
                  {mxnFmt.format(totalExpenses)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ══ ACCIONES RÁPIDAS ══════════════════════════════════════════════════ */}
      <div className="grid grid-cols-4 gap-2" style={{ marginBottom: '32px' }} role="navigation" aria-label="Acciones rápidas">
        {quickActions.map((action) => {
          const tileContent = (
            <div
              className={cn('et-card flex flex-col items-center gap-2 p-3', action.tileClass)}
              style={{ cursor: 'pointer', border: '1px solid' }}
            >
              <span
                className={cn('flex items-center justify-center', action.iconClass)}
                style={{ width: '40px', height: '40px', borderRadius: '12px' }}
                aria-hidden="true"
              >
                {action.icon}
              </span>
              <span style={{ fontSize: '11px', fontWeight: 600, color: '#374151', textAlign: 'center', lineHeight: 1.2 }}>
                {action.label}
              </span>
            </div>
          );

          if (action.isFab) {
            return (
              <button
                key={action.label}
                type="button"
                aria-label={action.label}
                style={{ all: 'unset', display: 'block', width: '100%' }}
                onClick={() => {
                  const fab = document.querySelector<HTMLButtonElement>('[aria-label="Agregar transacción"]');
                  fab?.click();
                }}
              >
                {tileContent}
              </button>
            );
          }

          return (
            <Link key={action.label} href={action.href!} style={{ textDecoration: 'none', display: 'block' }}>
              {tileContent}
            </Link>
          );
        })}
      </div>

      {/* ── Resumen general ───────────────────────────────────────────────── */}
      <p style={{ fontSize: '13px', fontWeight: 600, color: '#134e4a', marginBottom: '12px' }}>Resumen general</p>
      <div className="grid grid-cols-2 gap-3" style={{ marginBottom: '32px' }}>
        <MetricCard label="Disponible"   value={Math.abs(totalBalance)} color={totalBalance >= 0 ? 'green' : 'amber'} subtext={totalBalance < 0 ? 'en déficit' : undefined} />
        <MetricCard label="Movimientos"  value={String(transactions.length)} color="neutral" icon={<BarChart2 size={15} />} />
        <MetricCard label="Mayor gasto"  value={topOverallLabel} color="purple" icon={<Tag size={15} />} className="col-span-2" />
      </div>

      {/* ══ RESUMEN DEL PERIODO ════════════════════════════════════════════════ */}
      <div className="flex items-center justify-between flex-wrap gap-3" style={{ marginBottom: '16px' }}>
        <p style={{ fontSize: '13px', fontWeight: 600, color: '#134e4a', margin: 0 }}>Resumen del periodo</p>

        {/* Segmented control — uses et-segment-* classes from globals.css */}
        <div className="et-segment-bar flex gap-1">
          {(Object.keys(PERIOD_LABELS) as Period[]).map(p => (
            <button
              key={p}
              type="button"
              onClick={() => setSelectedPeriod(p)}
              className={cn('et-segment-btn', selectedPeriod === p && 'active')}
            >
              {PERIOD_LABELS[p]}
            </button>
          ))}
        </div>
      </div>

      {periodMetrics.transactionCount === 0 ? (
        <div className="et-card" style={{ padding: '32px', textAlign: 'center', marginBottom: '24px' }}>
          <p style={{ fontSize: '14px', color: '#0f766e', fontWeight: 500, margin: 0 }}>Sin movimientos en este periodo</p>
          <p style={{ fontSize: '12px', color: 'rgba(15,118,110,0.55)', marginTop: '4px', marginBottom: 0 }}>Registra un movimiento para ver estadísticas.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3" style={{ marginBottom: '16px' }}>
          <MetricCard label="Gasto"       value={periodMetrics.totalExpense}                      color="red"     icon={<TrendingDown size={15} />} />
          <MetricCard label="Ingreso"      value={periodMetrics.totalIncome}                       color="green"   icon={<TrendingUp   size={15} />} />
          <MetricCard label="Balance"      value={periodMetrics.balance}                           color={periodMetrics.balance >= 0 ? 'blue' : 'red'} className="col-span-2" />
          <MetricCard label="Hormiga"      value={periodMetrics.hormigas}                          color="amber"   icon={<Coffee    size={15} />} />
          <MetricCard label="Mayor gasto"  value={periodMetrics.topClassificationLabel ?? '—'}     color="purple"  icon={<Tag       size={15} />} />
          <MetricCard label="Movimientos"  value={String(periodMetrics.transactionCount)}           color="neutral" icon={<BarChart2 size={15} />} />
        </div>
      )}

      {/* ── Límite diario ─────────────────────────────────────────────────── */}
      {selectedPeriod === 'today' && periodMetrics.transactionCount > 0 && (
        <div
          className="et-card"
          style={{
            padding: '20px',
            marginBottom: '24px',
            backgroundColor: periodMetrics.dailyLimitExceeded ? '#FFF1F2' : '#FFFBEB',
            borderColor:     periodMetrics.dailyLimitExceeded ? '#FECDD3' : '#FDE68A',
          }}
        >
          <div className="flex items-center justify-between" style={{ marginBottom: '16px' }}>
            <p style={{ fontSize: '12px', fontWeight: 600, color: periodMetrics.dailyLimitExceeded ? '#F43F5E' : '#92400E', margin: 0 }}>
              {periodMetrics.dailyLimitExceeded ? '⚠ Límite diario superado' : 'Límite diario'}
            </p>
            <span style={{
              fontSize: '22px', fontWeight: 700, fontVariantNumeric: 'tabular-nums',
              color: periodMetrics.dailyLimitProgress >= 90 ? '#F43F5E' : periodMetrics.dailyLimitProgress >= 70 ? '#D97706' : '#059669',
            }}>
              {Math.min(periodMetrics.dailyLimitProgress, 100).toFixed(0)}%
            </span>
          </div>
          <Progress value={periodMetrics.dailyLimitProgress} current={periodMetrics.totalExpense} limit={DEFAULT_DAILY_LIMIT} showLabels />
        </div>
      )}

      {/* ── Sugerencias del día ───────────────────────────────────────────── */}
      {suggestions.length > 0 && (
        <section aria-label="Sugerencias del día" style={{ marginBottom: '32px' }}>
          <p style={{ fontSize: '13px', fontWeight: 600, color: '#134e4a', marginBottom: '12px' }}>Sugerencias del día</p>
          {suggestions.map((s, i) => (
            <div key={i} className="et-suggestion">{s}</div>
          ))}
        </section>
      )}

      {/* ══ ESTADÍSTICAS ══════════════════════════════════════════════════════ */}
      <p style={{ fontSize: '13px', fontWeight: 600, color: '#134e4a', marginBottom: '16px' }}>Estadísticas</p>

      {/* Vista anual */}
      <div className="et-chart-card" style={{ marginBottom: '16px' }}>
        <p style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'rgba(120,53,15,0.5)', marginBottom: '16px', margin: '0 0 16px' }}>
          Vista anual
        </p>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={yearlyData} margin={{ top: 4, right: 4, left: 0, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" strokeOpacity={0.8} />
            <XAxis dataKey="year"  tick={{ fontSize: 11, fill: '#A8A29E' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: '#A8A29E' }} width={62} tickFormatter={v => mxnFmt.format(v)} axisLine={false} tickLine={false} />
            <Tooltip content={<ChartTooltip />} />
            <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '12px', paddingTop: '12px' }} />
            <Line type="monotone" dataKey="income"  name="Ingresos" stroke={INCOME_COLOR}  strokeWidth={2.5} dot={false} activeDot={{ r: 4, strokeWidth: 0 }} />
            <Line type="monotone" dataKey="expense" name="Gastos"   stroke={EXPENSE_COLOR} strokeWidth={2.5} dot={false} activeDot={{ r: 4, strokeWidth: 0 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Vista mensual */}
      <div className="et-chart-card" style={{ marginBottom: '16px' }}>
        <div className="flex items-center justify-between" style={{ marginBottom: '16px' }}>
          <p style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'rgba(120,53,15,0.5)', margin: 0 }}>
            Vista mensual
          </p>
          <select
            value={selectedMonthlyYear}
            onChange={e => setSelectedMonthlyYear(e.target.value)}
            style={{ height: '28px', borderRadius: '8px', border: '1px solid #FDE68A', padding: '0 10px', fontSize: '12px', color: '#78350F', backgroundColor: '#ffffff', cursor: 'pointer', outline: 'none' }}
          >
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={monthlyData} margin={{ top: 4, right: 4, left: 0, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" strokeOpacity={0.8} />
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#A8A29E' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: '#A8A29E' }} width={62} tickFormatter={v => mxnFmt.format(v)} axisLine={false} tickLine={false} />
            <Tooltip content={<ChartTooltip />} />
            <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '12px', paddingTop: '12px' }} />
            <Line type="monotone" dataKey="income"  name="Ingresos" stroke={INCOME_COLOR}  strokeWidth={2.5} dot={false} activeDot={{ r: 4, strokeWidth: 0 }} />
            <Line type="monotone" dataKey="expense" name="Gastos"   stroke={EXPENSE_COLOR} strokeWidth={2.5} dot={false} activeDot={{ r: 4, strokeWidth: 0 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Gasto por concepto */}
      <div className="et-chart-card">
        <p style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'rgba(120,53,15,0.5)', margin: '0 0 16px' }}>
          Gasto por concepto
        </p>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={categoryChartData} margin={{ top: 4, right: 4, left: 0, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" strokeOpacity={0.8} />
            <XAxis dataKey="category" tick={{ fontSize: 11, fill: '#A8A29E' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: '#A8A29E' }} width={62} tickFormatter={v => mxnFmt.format(v)} axisLine={false} tickLine={false} />
            <Tooltip content={<ChartTooltip />} />
            <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '12px', paddingTop: '12px' }} />
            <Bar dataKey="spending" name="Gasto" fill={EXPENSE_COLOR} radius={[4, 4, 0, 0]} maxBarSize={48} />
          </BarChart>
        </ResponsiveContainer>
      </div>

    </div>
  );
}
