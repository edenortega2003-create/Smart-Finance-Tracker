import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
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

  // Use explicit CSS classes from globals.css — bypasses Tailwind v4 scanning issue
  return (
    <div
      className={cn('et-card flex flex-col gap-2 p-5', `mc-${color}`, className)}
    >
      {/* Label + icon */}
      <div className="flex items-center justify-between gap-2">
        <span className={cn('text-[11px] font-semibold uppercase tracking-widest', `lbl-${color}`)}>
          {label}
        </span>
        {icon && (
          <span
            className={cn('shrink-0 flex items-center justify-center w-7 h-7', `ic-${color}`)}
            aria-hidden="true"
          >
            {icon}
          </span>
        )}
      </div>

      {/* Value */}
      <span className={cn('text-[22px] font-bold tabular-nums leading-none tracking-tight', `val-${color}`)}>
        {formatValue(value)}
      </span>

      {/* Subtext */}
      {subtext && (
        <p className={cn('text-[12px] leading-snug mt-0.5', `lbl-${color}`)}>
          {subtext}
        </p>
      )}
    </div>
  );
}

export { colorMap };
