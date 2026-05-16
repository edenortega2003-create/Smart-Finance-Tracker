import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Card } from '../ui/Card';
import { Skeleton } from '../ui/Skeleton';
import type { AmountColor } from './AmountDisplay';

export type MetricColor = 'green' | 'red' | 'blue' | 'purple' | 'amber' | 'neutral';

interface MetricCardProps {
  label: string;
  value: number | string;
  currency?: string;
  color?: MetricColor;
  icon?: ReactNode;
  subtext?: string;
  isLoading?: boolean;
  glass?: boolean;
  className?: string;
}

const colorMap: Record<MetricColor, Exclude<AmountColor, 'auto'>> = {
  green:   'income',
  red:     'expense',
  blue:    'blue',
  purple:  'purple',
  amber:   'amber',
  neutral: 'neutral',
};

// Psychologically warm: emerald for positive, rose for negative (not alarm red)
const valueColorClasses: Record<MetricColor, string> = {
  green:   'text-emerald-600',
  red:     'text-rose-500',
  blue:    'text-blue-600',
  purple:  'text-violet-600',
  amber:   'text-amber-600',
  neutral: 'text-zinc-800',
};

const iconBgClasses: Record<MetricColor, string> = {
  green:   'bg-emerald-500/10 text-emerald-600',
  red:     'bg-rose-500/10 text-rose-500',
  blue:    'bg-blue-500/10 text-blue-600',
  purple:  'bg-violet-500/10 text-violet-600',
  amber:   'bg-amber-500/10 text-amber-600',
  neutral: 'bg-zinc-500/10 text-zinc-500',
};

const mxnFormatter = new Intl.NumberFormat('es-MX', {
  style:                 'currency',
  currency:              'MXN',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function formatValue(value: number | string): string {
  if (typeof value === 'string') return value;
  return mxnFormatter.format(value);
}

export function MetricCard({
  label,
  value,
  currency,
  color = 'neutral',
  icon,
  subtext,
  isLoading = false,
  glass = false,
  className,
}: MetricCardProps) {
  if (isLoading) {
    return <Skeleton className={cn('h-28', className)} />;
  }

  return (
    <Card glass={glass} className={cn('flex flex-col gap-2.5 p-5', className)}>
      {/* Label row */}
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-semibold uppercase tracking-widest text-zinc-400">
          {label}
        </span>
        {icon && (
          <span
            className={cn(
              'shrink-0 flex items-center justify-center w-7 h-7 rounded-lg',
              iconBgClasses[color],
            )}
            aria-hidden="true"
          >
            {icon}
          </span>
        )}
      </div>

      {/* Value — the most important thing on the card */}
      <span
        className={cn(
          'text-[22px] font-bold tabular-nums leading-none tracking-tight',
          valueColorClasses[color],
        )}
      >
        {formatValue(value)}
      </span>

      {/* Subtext — supporting context */}
      {subtext && (
        <p className="text-[12px] text-zinc-400 leading-snug mt-0.5">
          {subtext}
        </p>
      )}
    </Card>
  );
}

export { colorMap };
