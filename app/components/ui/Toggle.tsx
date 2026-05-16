'use client';

import { cn } from '@/lib/utils';

export interface ToggleOption {
  value: string;
  label: string;
}

interface ToggleProps {
  options: ToggleOption[];
  value: string;
  onChange: (value: string) => void;
  size?: 'sm' | 'md';
  className?: string;
}

const sizeClasses = {
  sm: 'h-7 px-3 text-xs',
  md: 'h-9 px-4 text-sm',
};

export function Toggle({ options, value, onChange, size = 'md', className }: ToggleProps) {
  return (
    <div
      role="group"
      className={cn(
        'inline-flex items-center rounded-lg bg-black/5 p-0.5 gap-0.5',
        className,
      )}
    >
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          aria-pressed={value === opt.value}
          onClick={() => onChange(opt.value)}
          className={cn(
            'rounded-md font-medium transition-all duration-[var(--duration-fast)] ease-[var(--ease-ui)]',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500',
            sizeClasses[size],
            value === opt.value
              ? 'bg-white text-gray-900 shadow-[var(--shadow-sm)]'
              : 'text-gray-500 hover:text-gray-700 hover:bg-white/50',
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
