import { Transaction, ExpenseClassification, IncomeClassification } from '../types';
import { getClassificationLabel } from './classifySuggestion';

export const DEFAULT_DAILY_LIMIT = 300;

export type Period = 'today' | 'yesterday' | 'week' | 'month';

export const PERIOD_LABELS: Record<Period, string> = {
  today:     'Hoy',
  yesterday: 'Ayer',
  week:      'Esta semana',
  month:     'Este mes',
};

export interface DailyMetrics {
  totalExpense: number;
  totalIncome: number;
  balance: number;
  hormigas: number;
  topClassificationKey: string | null;
  topClassificationLabel: string | null;
  transactionCount: number;
  dailyLimitExceeded: boolean;
  dailyLimitProgress: number; // 0–100
}

function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function getLocalToday(): string {
  return formatDate(new Date());
}

function getDateRange(period: Period): { start: string; end: string } {
  const now   = new Date();
  const today = getLocalToday();

  switch (period) {
    case 'today':
      return { start: today, end: today };

    case 'yesterday': {
      const d = new Date(now);
      d.setDate(d.getDate() - 1);
      const s = formatDate(d);
      return { start: s, end: s };
    }

    case 'week': {
      const dayOfWeek    = now.getDay(); // 0 = domingo
      const daysFromMon  = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      const monday       = new Date(now);
      monday.setDate(now.getDate() - daysFromMon);
      return { start: formatDate(monday), end: today };
    }

    case 'month': {
      const first = new Date(now.getFullYear(), now.getMonth(), 1);
      return { start: formatDate(first), end: today };
    }
  }
}

function computeMetrics(
  filtered: Transaction[],
  dailyLimit: number
): DailyMetrics {
  const expenses = filtered.filter(t => t.type === 'expense');
  const incomes  = filtered.filter(t => t.type === 'income');

  const totalExpense = expenses.reduce((sum, t) => sum + t.amount, 0);
  const totalIncome  = incomes.reduce((sum, t) => sum + t.amount, 0);

  const hormigas = expenses
    .filter(t => t.classification === 'hormiga')
    .reduce((sum, t) => sum + t.amount, 0);

  const clsTotals: Record<string, number> = {};
  for (const t of expenses) {
    const key = t.classification ?? 'otro';
    clsTotals[key] = (clsTotals[key] || 0) + t.amount;
  }

  const topEntry = Object.entries(clsTotals).sort(([, a], [, b]) => b - a)[0];
  const topClassificationKey   = topEntry?.[0] ?? null;
  const topClassificationLabel = topClassificationKey
    ? getClassificationLabel(
        topClassificationKey as ExpenseClassification | IncomeClassification,
        'expense'
      )
    : null;

  const dailyLimitProgress = dailyLimit > 0
    ? Math.min((totalExpense / dailyLimit) * 100, 100)
    : 0;

  return {
    totalExpense,
    totalIncome,
    balance: totalIncome - totalExpense,
    hormigas,
    topClassificationKey,
    topClassificationLabel,
    transactionCount: filtered.length,
    dailyLimitExceeded: totalExpense > dailyLimit,
    dailyLimitProgress,
  };
}

export function getPeriodMetrics(
  transactions: Transaction[],
  period: Period,
  dailyLimit = DEFAULT_DAILY_LIMIT
): DailyMetrics {
  const { start, end } = getDateRange(period);
  const filtered = transactions.filter(t => t.date >= start && t.date <= end);
  return computeMetrics(filtered, dailyLimit);
}

// Usado internamente por getDailySuggestions — siempre sobre el día actual
function getTodayMetrics(transactions: Transaction[], dailyLimit = DEFAULT_DAILY_LIMIT): DailyMetrics {
  return getPeriodMetrics(transactions, 'today', dailyLimit);
}

export function getDailySuggestions(
  transactions: Transaction[],
  dailyLimit = DEFAULT_DAILY_LIMIT
): string[] {
  const m = getTodayMetrics(transactions, dailyLimit);

  if (m.transactionCount === 0) {
    return [
      'Aún no registras movimientos hoy. Registrar incluso gastos pequeños mejora tu control financiero.',
    ];
  }

  const suggestions: string[] = [];

  if (m.balance > 0 && m.totalIncome > 0) {
    suggestions.push('Buen trabajo: hoy tus ingresos superan tus gastos.');
  }

  if (m.balance < 0 && m.totalIncome > 0) {
    suggestions.push(
      'Hoy gastaste más de lo que ingresaste. Revisa si fue por gasto fijo, variable u hormiga.'
    );
  }

  if (m.hormigas > 0 && m.hormigas > dailyLimit * 0.2) {
    suggestions.push(
      'Tus gastos hormiga de hoy ya son relevantes. Revisa si alguno fue innecesario.'
    );
  }

  if (m.totalIncome > 0 && m.totalExpense === 0) {
    suggestions.push(
      'Registraste ingresos hoy. Considera separar una parte para ahorro o inversión.'
    );
  }

  const hormigarMentioned = suggestions.some(s => s.includes('hormiga'));
  if (m.topClassificationKey === 'hormiga' && !hormigarMentioned) {
    suggestions.push(
      'Tu mayor fuga de hoy está en gastos hormiga. Pequeños consumos acumulados pueden pesar al final del mes.'
    );
  } else if (m.topClassificationKey === 'fijo') {
    suggestions.push(
      'Tus gastos fijos dominan el día. Verifica que estén dentro de tu presupuesto mensual.'
    );
  } else if (m.topClassificationKey === 'variable') {
    suggestions.push(
      'Tu mayor gasto está en variables. Puede ser normal, pero conviene monitorearlo.'
    );
  }

  return suggestions.slice(0, 3);
}
