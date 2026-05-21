import { Transaction, CustomHabit } from '../types';
import { HABIT_GROUPS, HabitGroupId } from './habitGroups';
import { resolveHabitMeta, ResolvedHabitMeta } from './customHabitUtils';

// ─── Output type ──────────────────────────────────────────────────────────────

export interface HabitSnapshot {
  id: string;
  label: string;
  emoji: string;
  accentColor: string;
  bgColor: string;
  borderColor: string;
  total: number;
}

export interface HabitChange extends HabitSnapshot {
  prevTotal: number;
  delta: number;    // current - prev (positive = increased spending)
  pct: number;      // % change vs prev month
}

export interface MonthlyInsights {
  monthLabel: string;          // e.g. "Mayo 2026"
  incomeTotal: number;
  expenseTotal: number;
  balance: number;
  prevIncomeTotal: number;
  prevExpenseTotal: number;
  txCount: number;             // expense transactions this month

  dominantHabit: HabitSnapshot | null;
  risingHabit: HabitChange | null;    // largest spending increase vs prior month
  fallingHabit: HabitChange | null;   // largest spending decrease vs prior month

  positiveSignal: string | null;
  warnings: string[];
  recommendation: string | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const ES_MONTHS = [
  'Enero','Febrero','Marzo','Abril','Mayo','Junio',
  'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre',
];

function parseLocalDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function dateInRange(dateStr: string, start: Date, end: Date): boolean {
  const d = parseLocalDate(dateStr);
  return d >= start && d <= end;
}

type HabitBucket = { current: number; prev: number; meta: ResolvedHabitMeta };

// ─── Main computation ─────────────────────────────────────────────────────────

export function computeMonthlyInsights(
  transactions: Transaction[],
  customHabits: CustomHabit[],
  now: Date = new Date(),
): MonthlyInsights | null {
  const y = now.getFullYear();
  const m = now.getMonth(); // 0-indexed

  const currStart = new Date(y, m, 1);
  const currEnd   = new Date(y, m + 1, 0, 23, 59, 59);
  const prevStart = new Date(y, m - 1, 1);
  const prevEnd   = new Date(y, m, 0, 23, 59, 59);

  // Totals
  let incomeTotal     = 0;
  let expenseTotal    = 0;
  let prevIncomeTotal = 0;
  let prevExpenseTotal = 0;
  let txCount         = 0;

  const buckets = new Map<string, HabitBucket>();

  // Seed base habit groups
  for (const g of HABIT_GROUPS) {
    buckets.set(g.id, {
      current: 0,
      prev: 0,
      meta: { id: g.id, label: g.label, emoji: g.emoji, accentColor: g.accentColor, bgColor: g.bgColor, borderColor: g.borderColor, isCustom: false },
    });
  }

  // Seed active custom habits
  for (const h of customHabits) {
    if (!h.archived) {
      buckets.set(h.id, {
        current: 0,
        prev: 0,
        meta: { id: h.id, label: h.label, emoji: h.emoji, accentColor: h.accentColor, bgColor: h.bgColor, borderColor: h.borderColor, isCustom: true },
      });
    }
  }

  for (const tx of transactions) {
    const inCurr = dateInRange(tx.date, currStart, currEnd);
    const inPrev = dateInRange(tx.date, prevStart, prevEnd);

    if (!inCurr && !inPrev) continue;

    if (tx.type === 'income') {
      if (inCurr) incomeTotal     += tx.amount;
      if (inPrev) prevIncomeTotal += tx.amount;
      continue;
    }

    // expense
    if (inCurr) {
      expenseTotal += tx.amount;
      txCount++;
    }
    if (inPrev) {
      prevExpenseTotal += tx.amount;
    }

    // Resolve habit bucket
    const meta = resolveHabitMeta(tx.concept ?? '', tx.habitCategory, customHabits);
    let bucket = buckets.get(meta.id);
    if (!bucket) {
      // Archived custom habit still referenced — add a temporary bucket
      bucket = { current: 0, prev: 0, meta };
      buckets.set(meta.id, bucket);
    }
    if (inCurr) bucket.current += tx.amount;
    if (inPrev) bucket.prev    += tx.amount;
  }

  // No expense data this month → nothing to show
  if (txCount === 0) return null;

  // Build sorted arrays by current-month total (exclude 'otro' from dominance)
  const nonOtro = [...buckets.values()].filter(b => b.meta.id !== ('otro' as HabitGroupId));
  const active  = nonOtro.filter(b => b.current > 0).sort((a, b) => b.current - a.current);

  // Dominant habit
  const dominantHabit: HabitSnapshot | null = active.length > 0
    ? {
        id:          active[0].meta.id,
        label:       active[0].meta.label,
        emoji:       active[0].meta.emoji,
        accentColor: active[0].meta.accentColor,
        bgColor:     active[0].meta.bgColor,
        borderColor: active[0].meta.borderColor,
        total:       active[0].current,
      }
    : null;

  // Rising and falling — only where prev > 0 (need baseline to compare)
  const compared: HabitChange[] = nonOtro
    .filter(b => b.prev > 0 && b.current > 0)
    .map(b => ({
      id:          b.meta.id,
      label:       b.meta.label,
      emoji:       b.meta.emoji,
      accentColor: b.meta.accentColor,
      bgColor:     b.meta.bgColor,
      borderColor: b.meta.borderColor,
      total:       b.current,
      prevTotal:   b.prev,
      delta:       b.current - b.prev,
      pct:         Math.round(((b.current - b.prev) / b.prev) * 100),
    }));

  const risingHabit  = compared.filter(c => c.delta > 0).sort((a, b) => b.pct - a.pct)[0] ?? null;
  const fallingHabit = compared.filter(c => c.delta < 0).sort((a, b) => a.pct - b.pct)[0] ?? null;

  const balance = incomeTotal - expenseTotal;

  // ── Human messages ────────────────────────────────────────────────────────

  let positiveSignal: string | null = null;
  const warnings: string[]          = [];
  let recommendation: string | null = null;

  // Positive signals (pick most meaningful)
  if (balance > 0 && incomeTotal > 0) {
    positiveSignal = 'Buen avance: mantuviste más ingresos que gastos este mes.';
  } else if (fallingHabit && Math.abs(fallingHabit.pct) >= 15) {
    positiveSignal = `Mejoraste: tu gasto en ${fallingHabit.emoji} ${fallingHabit.label} bajó un ${Math.abs(fallingHabit.pct)}% vs el mes anterior.`;
  } else if (incomeTotal > 0 && expenseTotal > 0) {
    const savingRate = ((incomeTotal - expenseTotal) / incomeTotal) * 100;
    if (savingRate > 0) {
      positiveSignal = `Ahorraste el ${Math.round(savingRate)}% de tus ingresos este mes.`;
    }
  }

  // Warnings
  if (balance < 0) {
    warnings.push('Este mes los gastos superaron los ingresos. Considera revisar tus hábitos.');
  }
  if (risingHabit && risingHabit.pct >= 20) {
    warnings.push(`Cuidado: ${risingHabit.emoji} ${risingHabit.label} subió un ${risingHabit.pct}% frente al mes anterior.`);
  }

  // Recommendation
  if (dominantHabit) {
    const domPct = expenseTotal > 0
      ? Math.round((dominantHabit.total / expenseTotal) * 100)
      : 0;
    if (domPct >= 40) {
      recommendation = `Podrías establecer un límite mensual para ${dominantHabit.emoji} ${dominantHabit.label} — representa el ${domPct}% de tus gastos.`;
    } else {
      recommendation = `Tu hábito dominante este mes fue ${dominantHabit.emoji} ${dominantHabit.label}.`;
    }
  }

  const monthLabel = `${ES_MONTHS[m]} ${y}`;

  return {
    monthLabel,
    incomeTotal,
    expenseTotal,
    balance,
    prevIncomeTotal,
    prevExpenseTotal,
    txCount,
    dominantHabit,
    risingHabit,
    fallingHabit,
    positiveSignal,
    warnings,
    recommendation,
  };
}
