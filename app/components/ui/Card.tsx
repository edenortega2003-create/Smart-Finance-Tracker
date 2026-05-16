import { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  glass?: boolean;
}

export function Card({ glass = false, className, children, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-xl p-5 transition-all duration-[var(--duration-normal)]',
        glass
          ? [
              'bg-white/10 backdrop-blur-[16px] saturate-[1.6]',
              'border border-white/[0.18]',
              'shadow-[0_8px_32px_rgba(0,0,0,0.08),0_2px_8px_rgba(0,0,0,0.04)]',
            ]
          : [
              'bg-white',
              'border border-black/[0.07]',
              'shadow-[0_1px_3px_rgba(0,0,0,0.07),0_1px_2px_rgba(0,0,0,0.05)]',
              'hover:shadow-[0_4px_8px_rgba(0,0,0,0.08),0_2px_4px_rgba(0,0,0,0.05)]',
              'hover:-translate-y-px',
            ],
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
