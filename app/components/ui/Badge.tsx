import { cn } from '@/lib/utils';

type BadgeVariant =
  | 'default'
  | 'income'
  | 'expense'
  | 'warning'
  | 'premium'
  | 'info'
  // expense classifications
  | 'hormiga'
  | 'fijo'
  | 'variable'
  | 'esporadico'
  | 'inversion'
  | 'deuda'
  | 'ahorro'
  // regularity
  | 'regular'
  | 'recurrente'
  | 'eventual';

type BadgeSize = 'sm' | 'md';

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  size?: BadgeSize;
  className?: string;
}

const variantClasses: Record<BadgeVariant, string> = {
  // Base
  default:    'bg-gray-100/80 text-gray-600 border border-black/[0.06]',
  income:     'bg-green-500/10 text-green-700',
  expense:    'bg-red-500/10 text-red-700',
  warning:    'bg-amber-500/10 text-amber-700',
  premium:    'bg-violet-500/10 text-violet-700',
  info:       'bg-blue-500/10 text-blue-700',
  // Expense classifications — each gets a distinct but tasteful color
  hormiga:    'bg-amber-400/10 text-amber-700',
  fijo:       'bg-slate-400/10 text-slate-600',
  variable:   'bg-sky-500/10 text-sky-700',
  esporadico: 'bg-orange-400/10 text-orange-700',
  inversion:  'bg-violet-500/10 text-violet-700',
  deuda:      'bg-rose-500/10 text-rose-700',
  ahorro:     'bg-emerald-500/10 text-emerald-700',
  // Regularity
  regular:    'bg-blue-500/10 text-blue-700',
  recurrente: 'bg-indigo-500/10 text-indigo-700',
  eventual:   'bg-gray-400/10 text-gray-600',
};

const sizeClasses: Record<BadgeSize, string> = {
  sm: 'px-1.5 py-0.5 text-[10px]',
  md: 'px-2 py-0.5 text-[11px]',
};

export function Badge({ label, variant = 'default', size = 'md', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full font-medium leading-none whitespace-nowrap',
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
    >
      {label}
    </span>
  );
}
