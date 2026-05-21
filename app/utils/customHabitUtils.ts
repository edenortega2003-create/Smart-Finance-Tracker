import { Transaction, CustomHabit } from '../types';
import { HABIT_GROUPS, HabitGroupMeta, inferHabitGroup } from './habitGroups';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ResolvedHabitMeta {
  id: string;
  label: string;
  emoji: string;
  accentColor: string;
  bgColor: string;
  borderColor: string;
  isCustom: boolean;
}

function toResolved(m: HabitGroupMeta): ResolvedHabitMeta {
  return { ...m, isCustom: false };
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Resolves which habit a transaction belongs to.
 * Priority: explicit UUID match in customHabits → base HabitGroupId match → keyword inference.
 * Returns null only if the transaction is income (not categorized by habits).
 */
export function resolveHabitMeta(
  concept: string,
  habitCategory: string | undefined,
  customHabits: CustomHabit[],
): ResolvedHabitMeta {
  // 1. Explicit UUID — check custom habits first (even archived, for display continuity)
  if (habitCategory) {
    const custom = customHabits.find((h) => h.id === habitCategory);
    if (custom) {
      return {
        id: custom.id,
        label: custom.label,
        emoji: custom.emoji,
        accentColor: custom.accentColor,
        bgColor: custom.bgColor,
        borderColor: custom.borderColor,
        isCustom: true,
      };
    }
  }

  // 2. Base group (handles both explicit HabitGroupId and keyword inference)
  const gid = inferHabitGroup(concept, habitCategory);
  const base = HABIT_GROUPS.find((g) => g.id === gid)!;
  return toResolved(base);
}

/**
 * Returns true if the transaction belongs to the given filter id.
 * filterId can be a HabitGroupId ('alimentacion', etc.) or a custom habit UUID.
 */
export function matchesHabitFilter(
  tx: Transaction,
  filterId: string,
  customHabits: CustomHabit[],
): boolean {
  const meta = resolveHabitMeta(tx.concept, tx.habitCategory, customHabits);
  return meta.id === filterId;
}

// ─── Stats ────────────────────────────────────────────────────────────────────

export interface CustomHabitStats {
  meta: ResolvedHabitMeta;
  monthlyTotal: number;
  weeklyTotal: number;
  count: number;
  prevMonthTotal: number;
}

function parseLocalDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/**
 * Computes stats for custom habits (non-archived) from expense transactions.
 */
export function computeCustomHabitStats(
  transactions: Transaction[],
  customHabits: CustomHabit[],
): CustomHabitStats[] {
  const active = customHabits.filter((h) => !h.archived);
  if (active.length === 0) return [];

  const now = new Date();
  const monthStart    = new Date(now.getFullYear(), now.getMonth(), 1);
  const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const prevMonthEnd   = new Date(now.getFullYear(), now.getMonth(), 0);
  const weekStart = new Date(now);
  weekStart.setDate(weekStart.getDate() - 6);
  weekStart.setHours(0, 0, 0, 0);

  type Bucket = { monthly: number; weekly: number; count: number; prevMonth: number };
  const buckets = new Map<string, Bucket>();
  for (const h of active) {
    buckets.set(h.id, { monthly: 0, weekly: 0, count: 0, prevMonth: 0 });
  }

  for (const tx of transactions) {
    if (tx.type === 'income') continue;
    if (!tx.habitCategory) continue;
    if (!buckets.has(tx.habitCategory)) continue;

    const txDate = parseLocalDate(tx.date);
    const b = buckets.get(tx.habitCategory)!;

    if (txDate >= monthStart && txDate <= now) {
      b.monthly += tx.amount;
      b.count   += 1;
    }
    if (txDate >= weekStart && txDate <= now) {
      b.weekly += tx.amount;
    }
    if (txDate >= prevMonthStart && txDate <= prevMonthEnd) {
      b.prevMonth += tx.amount;
    }
  }

  return active
    .map((h) => {
      const b = buckets.get(h.id)!;
      return {
        meta: {
          id: h.id,
          label: h.label,
          emoji: h.emoji,
          accentColor: h.accentColor,
          bgColor: h.bgColor,
          borderColor: h.borderColor,
          isCustom: true,
        },
        monthlyTotal:   b.monthly,
        weeklyTotal:    b.weekly,
        count:          b.count,
        prevMonthTotal: b.prevMonth,
      };
    })
    .sort((a, b) => b.monthlyTotal - a.monthlyTotal);
}
