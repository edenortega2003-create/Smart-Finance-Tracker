'use client';

import { forwardRef, InputHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className="flex flex-col gap-1.5 w-full">
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-zinc-700">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            'h-11 w-full rounded-[10px] border bg-white px-3.5 text-sm text-zinc-900',
            'placeholder:text-zinc-400',
            'transition-all duration-[120ms]',
            'focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            error
              ? 'border-rose-400 focus:ring-rose-400/30 focus:border-rose-500'
              : 'border-black/[0.10] hover:border-black/[0.18]',
            className,
          )}
          {...props}
        />
        {error && (
          <p className="text-xs text-rose-500 flex items-center gap-1" role="alert">
            <span aria-hidden="true">⚠</span> {error}
          </p>
        )}
      </div>
    );
  },
);

Input.displayName = 'Input';
