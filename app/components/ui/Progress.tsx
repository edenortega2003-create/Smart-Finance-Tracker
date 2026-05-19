import { cn } from '@/lib/utils';

interface ProgressProps {
  value: number;       // 0–100
  current?: number;
  limit?: number;
  currency?: string;
  showLabels?: boolean;
  className?: string;
}

// Soft semantic colors — progress should feel motivational, not alarming
function barColor(v: number) {
  if (v >= 90) return 'bg-rose-400';      // soft coral, not alarm red
  if (v >= 70) return 'bg-amber-400';
  return 'bg-emerald-500';                // calm growth green
}

function labelColor(v: number) {
  if (v >= 90) return 'text-rose-500';
  if (v >= 70) return 'text-amber-600';
  return 'text-emerald-600';
}

const mxnFormatter = new Intl.NumberFormat('es-MX', {
  style: 'currency', currency: 'MXN',
  minimumFractionDigits: 2, maximumFractionDigits: 2,
});

export function Progress({
  value,
  current,
  limit,
  currency = '$',
  showLabels = true,
  className,
}: ProgressProps) {
  const clamped = Math.min(Math.max(value, 0), 100);

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      {showLabels && current !== undefined && limit !== undefined && (
        <div className="flex items-center justify-between text-xs">
          <span className="text-zinc-500">
            <span className="font-semibold tabular-nums text-zinc-700">
              {mxnFormatter.format(current)}
            </span>
            <span className="text-zinc-400"> / {mxnFormatter.format(limit)}</span>
          </span>
          <span className={cn('font-bold tabular-nums', labelColor(clamped))}>
            {clamped.toFixed(0)}%
          </span>
        </div>
      )}
      <div className="h-2 w-full rounded-full bg-teal-100 overflow-hidden">
        <div
          className={cn(
            'h-full rounded-full transition-all ease-out',
            'duration-[var(--duration-crawl)]',
            barColor(clamped),
          )}
          style={{ width: `${clamped}%` }}
          role="progressbar"
          aria-valuenow={clamped}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
    </div>
  );
}
