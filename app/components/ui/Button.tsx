'use client';

import { forwardRef, ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'destructive';
type ButtonSize    = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: cn(
    'bg-indigo-500 text-white',
    'shadow-[0_1px_2px_rgba(99,102,241,0.20)]',
    'hover:bg-indigo-600 hover:shadow-[0_3px_10px_rgba(99,102,241,0.28)]',
    'active:bg-indigo-700',
    'focus-visible:ring-indigo-500',
  ),
  secondary: cn(
    'bg-white text-zinc-700',
    'border border-black/[0.09]',
    'shadow-[0_1px_2px_rgba(0,0,0,0.05)]',
    'hover:bg-zinc-50 hover:border-black/[0.14]',
    'active:bg-zinc-100',
    'focus-visible:ring-zinc-400',
  ),
  ghost: cn(
    'text-zinc-600',
    'hover:bg-black/[0.04] hover:text-zinc-900',
    'active:bg-black/[0.07]',
    'focus-visible:ring-zinc-400',
  ),
  destructive: cn(
    'bg-rose-50 text-rose-600',
    'border border-rose-200/70',
    'hover:bg-rose-100 hover:border-rose-300',
    'active:bg-rose-200',
    'focus-visible:ring-rose-400',
  ),
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'h-8 px-3.5 text-[13px] gap-1.5',
  md: 'h-10 px-4 text-sm gap-2',
  lg: 'h-11 px-5 text-[15px] gap-2',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', isLoading, className, disabled, children, ...props }, ref) => (
    <button
      ref={ref}
      disabled={disabled || isLoading}
      className={cn(
        // Layout
        'inline-flex items-center justify-center',
        // Shape
        'rounded-xl font-semibold',
        // Motion — snappy and tactile
        'transition-all duration-[120ms]',
        'active:scale-[0.97]',
        // Accessibility
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1',
        // Disabled
        'disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none',
        // Prevent accidental text selection on rapid clicks
        'select-none',
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
      {...props}
    >
      {isLoading ? (
        <span className="h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
      ) : children}
    </button>
  ),
);

Button.displayName = 'Button';
