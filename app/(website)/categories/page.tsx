'use client';

import { useMemo } from 'react';
import { useStore } from '../../store/useStore';
import { computeHabitStats, HabitGroupStats } from '../../utils/habitGroups';
import { TrendingUp, TrendingDown } from 'lucide-react';

// ─── Formatters ───────────────────────────────────────────────────────────────

const numFmt = new Intl.NumberFormat('es-MX', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function fmt(amount: number, symbol: string): string {
  return `${symbol}${numFmt.format(amount)}`;
}

function extractSymbol(currency: string): string {
  return currency.split(' ')[1] ?? '$';
}

// ─── Trend helper ─────────────────────────────────────────────────────────────

function getTrend(current: number, prev: number): { pct: number; up: boolean } | null {
  if (prev === 0 || current === 0) return null;
  const pct = ((current - prev) / prev) * 100;
  if (Math.abs(pct) < 1) return null;
  return { pct: Math.abs(pct), up: pct > 0 };
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      textAlign: 'center', padding: '56px 20px',
    }}>
      <span style={{ fontSize: '52px', lineHeight: 1, marginBottom: '20px' }}>🌱</span>
      <h2 style={{
        fontSize: '18px', fontWeight: 700, color: '#111827',
        margin: '0 0 10px', letterSpacing: '-0.02em',
      }}>
        Tu mapa está vacío
      </h2>
      <p style={{
        fontSize: '14px', color: '#6B7280', lineHeight: 1.65,
        margin: 0, maxWidth: '270px',
      }}>
        Registra tus primeros movimientos para ver cómo se distribuyen tus hábitos financieros.
      </p>
    </div>
  );
}

function HabitCard({
  stats,
  symbol,
  rank,
}: {
  stats: HabitGroupStats;
  symbol: string;
  rank: number;
}) {
  const { meta, monthlyTotal, weeklyTotal, count, prevMonthTotal } = stats;
  const trend    = getTrend(monthlyTotal, prevMonthTotal);
  const active   = count > 0;

  return (
    <div style={{
      backgroundColor: active ? meta.bgColor : 'rgba(0,0,0,0.02)',
      borderRadius: '16px',
      border: `1px solid ${active ? meta.borderColor : 'rgba(0,0,0,0.06)'}`,
      padding: '16px',
      display: 'flex',
      flexDirection: 'column',
      gap: '10px',
      opacity: active ? 1 : 0.45,
      transition: 'box-shadow 150ms ease, transform 150ms ease',
    }}>

      {/* Header row: emoji + label + top badge */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '7px', minWidth: 0 }}>
          <span style={{ fontSize: '20px', lineHeight: 1, flexShrink: 0 }}>{meta.emoji}</span>
          <span style={{
            fontSize: '12px', fontWeight: 700,
            color: active ? meta.accentColor : '#9CA3AF',
            letterSpacing: '-0.01em',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {meta.label}
          </span>
        </div>
        {rank === 1 && active && (
          <span style={{
            flexShrink: 0,
            fontSize: '10px', fontWeight: 700,
            backgroundColor: meta.accentColor, color: '#fff',
            padding: '2px 7px', borderRadius: '9999px',
          }}>
            Top
          </span>
        )}
      </div>

      {/* Monthly total */}
      <div>
        <p style={{
          fontSize: '10px', fontWeight: 700, color: '#9CA3AF',
          margin: '0 0 3px', letterSpacing: '0.06em', textTransform: 'uppercase',
        }}>
          Este mes
        </p>
        <span style={{
          fontSize: '20px', fontWeight: 700, letterSpacing: '-0.03em',
          fontVariantNumeric: 'tabular-nums', lineHeight: 1,
          color: active ? meta.accentColor : '#D1D5DB',
        }}>
          {active ? fmt(monthlyTotal, symbol) : `${symbol}0.00`}
        </span>
      </div>

      {/* Weekly + count — only when there's activity */}
      {active && (
        <div style={{ display: 'flex', gap: '14px' }}>
          <div>
            <p style={{
              fontSize: '10px', fontWeight: 600, color: '#9CA3AF',
              margin: '0 0 2px', textTransform: 'uppercase', letterSpacing: '0.05em',
            }}>
              Semana
            </p>
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#374151', fontVariantNumeric: 'tabular-nums' }}>
              {fmt(weeklyTotal, symbol)}
            </span>
          </div>
          <div>
            <p style={{
              fontSize: '10px', fontWeight: 600, color: '#9CA3AF',
              margin: '0 0 2px', textTransform: 'uppercase', letterSpacing: '0.05em',
            }}>
              Mov.
            </p>
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#374151' }}>
              {count}
            </span>
          </div>
        </div>
      )}

      {/* Trend vs last month */}
      {active && trend && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          {trend.up
            ? <TrendingUp  size={12} style={{ color: '#F59E0B', flexShrink: 0 }} />
            : <TrendingDown size={12} style={{ color: '#22C55E', flexShrink: 0 }} />
          }
          <span style={{
            fontSize: '11px', fontWeight: 600,
            color: trend.up ? '#B45309' : '#15803D',
          }}>
            {trend.up ? '+' : '−'}{trend.pct.toFixed(0)}% vs mes ant.
          </span>
        </div>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CategoriesPage() {
  const { transactions, settings } = useStore();
  const symbol = extractSymbol(settings.currency);

  const stats = useMemo(() => computeHabitStats(transactions), [transactions]);

  const hasAnyExpenses = useMemo(
    () => transactions.some(tx => tx.type === 'expense'),
    [transactions],
  );

  const totalMonth    = stats.reduce((s, g) => s + g.monthlyTotal, 0);
  const activeHabits  = stats.filter(g => g.count > 0).length;

  if (!hasAnyExpenses) {
    return <EmptyState />;
  }

  return (
    <div style={{ paddingTop: '4px' }}>

      {/* ── Summary header ─────────────────────────────────── */}
      <div style={{ marginBottom: '20px' }}>
        <p style={{
          fontSize: '11px', fontWeight: 700, color: '#9CA3AF',
          margin: '0 0 4px', letterSpacing: '0.07em', textTransform: 'uppercase',
        }}>
          Gasto total · este mes
        </p>
        <p style={{
          fontSize: '30px', fontWeight: 700, color: '#111827',
          margin: '0 0 4px', letterSpacing: '-0.03em',
          fontVariantNumeric: 'tabular-nums',
        }}>
          {fmt(totalMonth, symbol)}
        </p>
        <p style={{ fontSize: '13px', color: '#6B7280', margin: 0 }}>
          {activeHabits === 0
            ? 'Sin movimientos este mes'
            : `${activeHabits} ${activeHabits === 1 ? 'hábito activo' : 'hábitos activos'}`}
        </p>
      </div>

      {/* ── Habit grid ─────────────────────────────────────── */}
      <div className="habit-grid">
        {stats.map((s, i) => (
          <HabitCard
            key={s.meta.id}
            stats={s}
            symbol={symbol}
            rank={i + 1}
          />
        ))}
      </div>

      {/* ── Footer note ────────────────────────────────────── */}
      <p style={{
        fontSize: '11.5px', color: '#9CA3AF', textAlign: 'center',
        marginTop: '24px', lineHeight: 1.6,
      }}>
        Los hábitos se infieren del concepto del movimiento.
      </p>
    </div>
  );
}
