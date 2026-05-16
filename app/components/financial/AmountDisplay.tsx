import { cn } from '@/lib/utils';

export type AmountColor = 'income' | 'expense' | 'blue' | 'purple' | 'amber' | 'neutral' | 'auto';
export type AmountSize  = 'sm' | 'md' | 'lg' | 'display';

interface AmountDisplayProps {
  amount: number;
  currency?: string;
  color?: AmountColor;
  size?: AmountSize;
  showSign?: boolean;
  className?: string;
}

// Psychologically calibrated: emerald = growth/calm, rose = soft negative (no alarm red)
const colorClasses: Record<Exclude<AmountColor, 'auto'>, string> = {
  income:  'text-emerald-600',
  expense: 'text-rose-500',
  blue:    'text-blue-600',
  purple:  'text-violet-600',
  amber:   'text-amber-600',
  neutral: 'text-zinc-600',
};

const sizeClasses: Record<AmountSize, string> = {
  sm:      'text-sm font-semibold',
  md:      'text-base font-semibold',
  lg:      'text-xl font-semibold',
  display: 'text-3xl font-bold',
};

const mxnFormatter = new Intl.NumberFormat('es-MX', {
  style:                 'currency',
  currency:              'MXN',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function AmountDisplay({
  amount,
  currency,   // kept for API compatibility; display uses MXN internally
  color = 'auto',
  size = 'md',
  showSign = false,
  className,
}: AmountDisplayProps) {
  const resolvedColor: Exclude<AmountColor, 'auto'> =
    color === 'auto' ? (amount >= 0 ? 'income' : 'expense') : color;

  const formatted = mxnFormatter.format(Math.abs(amount));
  const sign = showSign ? (amount >= 0 ? '+' : '−') : '';

  return (
    <span
      className={cn(
        'tabular-nums',
        colorClasses[resolvedColor],
        sizeClasses[size],
        className,
      )}
    >
      {sign}{formatted}
    </span>
  );
}
